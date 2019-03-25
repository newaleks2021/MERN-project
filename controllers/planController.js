const Plan = require('../models/plan');
const getUpdatedFields = require('../helpers/getUpdatedFields');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Displays all subscription plans to a super admin
 */
const index = async (req, res) => {
    const plans = await Plan.fetchAll();

    res.render('plans/index', {
        title: `Plans overview`,
        plans: plans.toJSON()
    });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * To create a new subscription plan
 */
const create = async (req, res) => {
    if(!(req.body.name || req.body.price || req.body.currency || req.body.max_tocs || req.body.period)) {
        req.flash('error', __('flashes.missing-fields'));
        return res.redirect('/plans/all');
    }

    let errors = await Plan.ensureValidName(req.body.name);

    if(errors) {
        req.flash('error', errors);
        return res.redirect(`/plans/all`);
    }

    await Plan.forge({
        name: req.body.name,
        price: req.body.price,
        period: req.body.period,
        currency: req.body.currency,
        max_tocs: req.body.max_tocs
    }).save();

    req.flash('success', __('flashes.plans.successfully-created', req.body.name));
    return res.redirect('/plans/all');
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * To render the edit form for an existing subscription plan
 */
const showEdit = async (req, res) => {
    const plan = await Plan.where({id: req.params.id}).fetch();

    return res.render('plans/edit', {
        title: __('views.page-titles.edit-plan'),
        plan: plan.toJSON()
    });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * To save the edits to an existing subscription plan
 */
const edit = async (req, res) => {
    const planInstance = await Plan.where({id: req.params.id}).fetch();
    const plan = planInstance.toJSON();

    const updatedFields = getUpdatedFields(req.body, plan);

    let validated = true;

    if(Object.keys(updatedFields).length > 0)
    {
        for(let field of Object.keys(updatedFields))
        {
            if(updatedFields[field] === null)
            {
                req.flash('error', __('flashes.missing-fields'));
                return res.redirect('/plans/all');
            }
        }

        await planInstance.save(updatedFields, {patch: true});
    }

    req.flash('success', __('flashes.plans.successfully-updated', plan.name));
    return res.redirect('/plans/all');
};

module.exports = {
    index,
    create,
    showEdit,
    edit
};