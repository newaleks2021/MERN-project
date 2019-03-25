const bookshelf = require('../db');
const Coupon = require('../models/coupon');
const Plan = require('../models/plan');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Create a new discount coupon
 */
const create = async (req, res) => {
    if(!(req.body.code || req.body.description || (req.body.discount_amount || req.body.discount_percentage)))
    {
        req.flash('error', __('flashes.missing-fields'));
        return res.redirect('/coupons');
    }
    
    if(req.body.discount_amount && !(/[0-9]+/.test(req.body.discount_amount)))
    {
        req.flash('error', __('flashes.coupon.invalid-discount-amount'));
        return res.redirect('/coupons');
    }

    if(req.body.discount_percentage && !(/[0-9]+/.test(req.body.discount_percentage)))
    {
        req.flash('error', __('flashes.coupon.invalid-discount-percentage'));
        return res.redirect('/coupons');
    }

    if(req.body.extension_days && !(/[0-9]+/.test(req.body.extension_days)))
    {
        req.flash('error', __('flashes.coupon.invalid-extension-days'));
        return res.redirect('/coupons');
    }

    if(req.body.max_use && !(/[0-9]+/.test(req.body.max_use)))
    {
        req.flash('error', __('flashes.coupon.invalid-max-use'));
        return res.redirect('/coupons');
    }

    if(req.body.valid_for && !(/[0-9]+/.test(req.body.valid_for)))
    {
        req.flash('error', __('flashes.coupon.invalid-valid-for'));
        return res.redirect('/coupons');
    }

    if(req.body.exp_date && !(/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(req.body.exp_date)))
    {
        req.flash('error', __('flashes.coupon.invalid-exp-date'));
        return res.redirect('/coupons');
    }

    let coupon = await Coupon.where({ code: req.body.code }).fetch();
    if(coupon)
    {
        req.flash('error', __('flashes.coupon.duplicate-code'));
        return res.redirect('/coupons');
    }

    await Coupon.forge({
        code: req.body.code,
        description: req.body.description,
        discount_amount: (req.body.discount_amount) ? parseFloat(req.body.discount_amount) : 0.0,
        discount_percentage: (req.body.discount_percentage) ? parseFloat(req.body.discount_percentage) : 0.0,
        extension_days: (req.body.extension_days) ? parseInt(req.body.extension_days) : 0,
        max_use: (req.body.max_use) ? parseInt(req.body.max_use) : 0,
        valid_for: (req.body.valid_for) ? parseInt(req.body.valid_for) : 0,
        exp_date: (req.body.exp_date) ? req.body.exp_date : null,
        plan_id: (req.body.plan_id !== "0") ? parseInt(req.body.plan_id) : null
    }).save();

    req.flash('success', __('flashes.coupon.successfully-created', req.body.name));
    return res.redirect('/coupons');
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Let an existing discount coupon expire (discount coupons can't be deleted)
 */
const expire = async (req, res) => {
    let coupon = await Coupon.where({ code: req.params.code }).fetch();
    if(!coupon)
    {
        req.flash('error', __('flashes.coupon.not-found'));
        return res.redirect('/coupons');
    }

    let date = new Date();
    date.setDate(date.getDate() - 1);
    
    const exp_date = date.toISOString().split('T')[0];
    
    await coupon.save({
        exp_date: exp_date
    }, { patch: true });

    req.flash('success', __('flashes.coupon.successfully-expired'));
    return res.redirect('/coupons');
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Display all discount coupons
 */
const index = async (req, res) => {
    // When there are multiple query parameters of the same type
    if(typeof req.query.search == 'object') {
        req.query.search = Array.from(req.query.search)[1];
    }

    if(typeof req.query.sortBy == 'object') {
        req.query.sortBy = Array.from(req.query.sortBy)[1];
    }
    
    const pagination = {
        pageSize: process.env.PAGINATION_TOTAL_RESOURCES,
        page: req.query.page ? req.query.page : 1,
    };

    let raw = "";
    let search = "";
    let bindings = [];

    if(req.query.search)
    {
        Coupon.searchables.map((searchable, i) => {
            if(i == 0)
            {
                search += `${searchable} LIKE ?`;
            }
            else
            {
                search += ` OR ${searchable} LIKE ?`;
            }

            bindings.push(`%${req.query.search}%`);
        });
    }

    if(search !== "")
    {
        raw += "(" + search + ")";
    }

    let couponsCount = await bookshelf.knex("coupons").whereRaw(raw, bindings).count("id as count");
    let couponsQuery = bookshelf.knex.select("coupons.*", "plans.name AS plan_name").from("coupons").leftOuterJoin("plans", function()
    {
        this.on("plans.id", "=", "coupons.plan_id");  
    }).whereRaw(raw, bindings);

    if(req.query.sortBy)
    {
        couponsQuery.orderBy(req.query.sortBy, (req.query.sortOrder ? req.query.sortOrder : "ASC"));
    }

    couponsQuery.limit(pagination.pageSize).offset(pagination.pageSize * (pagination.page - 1));

    const coupons = await couponsQuery;

    pagination.rowCount = couponsCount[0].count;
    pagination.pageCount = parseInt(Math.ceil(parseFloat(pagination.rowCount) / parseFloat(pagination.pageSize)));
   
    const urlParts = [];
    let baseUrl = "?";

    if(req.query.search)
    {
        urlParts.push(`search=${req.query.search}`);
        baseUrl += `search=${req.query.search}&`;
    }

    if(req.query.sortBy)
    {
        urlParts.push(`sortBy=${req.query.sortBy}`);
    }

    if(req.query.sortOrder)
    {
        urlParts.push(`sortOrder=${req.query.sortOrder}`);
    }

    const url = "?" + (urlParts.length > 0 ? (urlParts.join("&") + "&") : "");
    const planNames = ["Startup quarterly", "Startup yearly", "Medium quarterly", "Medium yearly", "Large", "XL"];
    const plans = await Plan.where("name", "in", planNames).fetchAll();
    
    res.render('coupons/index', {
        title: __('views.page-titles.coupons-index'), 
        plans: plans.toJSON(),
        coupons,
        pagination: pagination,
        currentSort: req.query.sortBy ? req.query.sortBy : '',
        sortOrder: req.query.sortOrder ? req.query.sortOrder : 'ASC',
        reverseSortOrder: req.query.sortOrder === "ASC" ? "DESC" : "ASC",
        url,
        baseUrl
    });
};

module.exports = {
    index,
    create,
    expire
};
