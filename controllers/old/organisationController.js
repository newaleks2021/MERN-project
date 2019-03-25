const bookshelf = require('../db');
const fs = require('fs');
const path = require('path');
const addDays = require('date-fns/add_days');
const Organisation = require('../models/organisation');
const OrganisationMember = require('../models/organisationMember');
const Stakeholder = require('../models/stakeholder');
const SentEmail = require('../models/sent_email');
const Plan = require('../models/plan');
const Toc = require('../models/toc');
const validate = require('validate.js');
const getUpdatedFields = require('../helpers/getUpdatedFields');
const {countriesList, getCountryByCode, isEUCountry} = require('../helpers/countriesList');
const {newDateNow, newDateYesterday} = require('../helpers/dateHelper');
const sanitize = require('../helpers/sanitize');
const slug = require('slug');
const mailController = require('./mailController');

/**
 *
 * @param {*} req
 * @param {*} res
 */
const index = async (req, res) => {
    // When there are multiple query parameters of the same type
    if(typeof req.query.search == 'object') {
        req.query.search = Array.from(req.query.search)[1]
    }

    if(typeof req.query.sortBy == 'object') {
        req.query.sortBy = Array.from(req.query.sortBy)[1]
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
        Organisation.searchables.map((searchable, i) => {
            if(i == 0)
            {
                search += `organisations.${searchable} LIKE ?`
            }
            else
            {
                search += ` OR organisations.${searchable} LIKE ?`
            }

            bindings.push(`%${req.query.search}%`);
        });
    }

    if(search !== "")
    {
        raw += "(" + search + ")";
    }

    let organisationsCount = await bookshelf.knex("organisations").whereRaw(raw, bindings).count("id as count");
    let organisationsQuery = bookshelf.knex.select("organisations.*", "plans.name AS plan_name", "plans.max_tocs AS max_tocs", bookshelf.knex.raw("(SELECT COUNT (*) FROM tocs WHERE tocs.isActivated = 1 AND tocs.organisation_id = organisations.id) AS toc_amount")).from("organisations").innerJoin("plans", function()
    {
        this.on("plans.id", "=", "organisations.plan_id");
    }).whereRaw(raw, bindings);

    if(req.query.sortBy)
    {
        organisationsQuery.orderBy(req.query.sortBy, (req.query.sortOrder ? req.query.sortOrder : "ASC"));
    }

    organisationsQuery.limit(pagination.pageSize).offset(pagination.pageSize * (pagination.page - 1));

    const organisations = await organisationsQuery;

    pagination.rowCount = organisationsCount[0].count;
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
        urlParts.push(`sortBy=${req.query.sortBy}`)
    }

    if(req.query.sortOrder)
    {
        urlParts.push(`sortOrder=${req.query.sortOrder}`)
    }

    const url = "?" + (urlParts.length > 0 ? (urlParts.join("&") + "&") : "");

    res.render('organisations/index', {
        title: __('views.page-titles.organisations-index'),
        organisations,
        pagination: pagination,
        currentSort: req.query.sortBy ? req.query.sortBy : '',
        sortOrder: req.query.sortOrder ? req.query.sortOrder : 'ASC',
        reverseSortOrder: req.query.sortOrder === "ASC" ? "DESC" : "ASC",
        url,
        baseUrl
    })
}

/**
 *
 * @param {Object} req
 * @param {Object} res
 */
const show = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        res.redirect('/404');
    }

    const organisation = await Organisation.where({slug: req.params.id}).fetch();

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        res.redirect('/404');
    }

    const plan = await Plan.where({id: organisation.get('plan_id')}).fetch();
    const members = await organisation.getMembersAsStakeholders(organisation.get('id'), Stakeholder);
    const tocs = await organisation.getTocs(organisation.get('id'));
    const amountOfActiveTocs = tocs.filter(function(toc){ return toc.get("isActivated") === 1 }).length;
    const flashes = Object.assign(req.session.flash, res.locals.flashes);

    let raw = "transactions.organisation_id = ?";
    let bindings = [organisation.get("id")];
    const transactions = await bookshelf.knex.select("transactions.*", "plans.name AS plan_name", "coupons.code AS coupon_code").from("transactions").innerJoin("plans", function()
    {
        this.on("plans.id", "=", "transactions.plan_id");
    }).leftOuterJoin("coupons", function()
    {
        this.on("coupons.id", "=", "transactions.coupon_id");
    }).whereRaw(raw, bindings).orderBy("transactions.created_at", "DESC");

    return res.render('organisations/profile', {
        title: `Organisation ${organisation.get('name')}`,
        organisation: organisation.toJSON(),
        members,
        amountOfActiveTocs,
        tocs: tocs ? tocs.toJSON() : tocs,
        plan: plan ? plan.toJSON() : plan,
        flashes,
        transactions
    });
}

/**
 *
 * @param {Object} req
 * @param {Object} res
 */
const showEdit = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        res.redirect('/404');
    }

    const organisation = await Organisation.where({slug: req.params.id}).fetch();
    const plans = await Plan.fetchAll();

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        return res.redirect('/404');
    }

    const members = await organisation.getMembersAsStakeholders(organisation.get('id'), Stakeholder);

    res.render('organisations/edit', {
        title: `Edit organisation ${organisation.get('name')}`,
        organisation: organisation.toJSON(),
        members,
        countriesList,
        plans: plans.toJSON(),
        oldInput: req.session.editOrganisationFormInput || {}
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const createFree = async (req, res) => {
    if(!req.body.username) {
        req.flash('error', req.__('flashes.unknown-problem'))
        res.redirect('back')
    }

    const stakeholder = await Stakeholder.where({username: req.body.username}).fetch();
    const freePlan = await Plan.where({price: 0.00}).fetch();

    if(stakeholder.get('hasUsedFreeTrial') && !req.session.user.isAdmin) {
        req.flash('error', req.__('flashes.organisations.out-of-free-trial'));
        return res.redirect(`/stakeholders/${req.body.username}`);
    }

    if(!req.body.name) {
        req.flash('error', req.__('flashes.organisations.missing-name'));
        return res.redirect(`/stakeholders/${req.body.username}`);
    }

    let errors = validate.single(req.body.name, Organisation.constraints.name) ||
                    await Organisation.ensureValidName(req.body.name);

    if(errors) {
        req.session['newPremiumOrganisationModalErrors'] = 1;
        req.flash('error', errors);

        return res.redirect(`/stakeholders/${req.body.username}`);
    }

    const slugname = slug(req.body.name, {lower: true});
    const organisationCheck = await Organisation.where({slug: slugname}).fetch();

    if(organisationCheck)
    {
        req.flash('error', req.__('flashes.organisations.duplicate-name'));
        return res.redirect(`/plans`);
    }

    const organisation = await Organisation.forge({
        name: req.body.name,
        slug: slugname,
        // ID: 1 = Free plan
        plan_id: freePlan.get('id'),
        subs_exp_date: addDays(newDateNow(), freePlan.get('period')),
        isActivated: true,
        activated_at: newDateNow()
    }).save();
    const organisationId = organisation.get("id");

    await OrganisationMember.forge({
        isAdmin: 1,
        stakeholder_id: stakeholder.get('id'),
        organisation_id: organisationId
    }).save().get('id');

    await stakeholder.save({hasUsedFreeTrial: true}, {patch: true});
    req.session.user.hasUsedFreeTrial = 1;
    req.session.newPremiumOrganisationModalErrors = null;

    await mailController.sendEmail(mailController.emails.uponCreatingFreeOrganisation, stakeholder.get("email"), {
        stakeholder: stakeholder.toJSON(),
        organisation: organisation.toJSON(),
        host: req.get('host')
    });

    req.flash('success', `New organisation ${req.body.name} was successfully created!`);
    return res.redirect(`/organisations/${slugname}/edit`);
}

/**
 *
 * @param {Object} req
 * @param {Object} res
 */
const createPremium = async (req, res) => {
    if(!req.body.username || !req.body.plan_id) {
        req.flash('error', req.__('flashes.unknown-problem'))
        res.redirect('back')
    }

    const stakeholder = await Stakeholder.where({username: req.body.username}).fetch();
    const plan = await Plan.where({id: req.body.plan_id}).fetch();

    if(!stakeholder || !plan) {
        req.flash('error', req.__('flashes.organisations.user-or-plan-not-found'))
        return res.redirect(`back`);
    }

    let errors = validate(req.body, Organisation.initialPremiumConstraints) ||
                    await Organisation.ensureValidName(req.body.name);

    if(errors) {
        req.session['newPremiumOrganisationModalErrors'] = 1;
        req.session['newPremiumOrganisationModalOpen'] = req.body.modalIdentifier;
        req.flash('error', errors);
        return res.redirect(`back`);
    }
    const slugname = slug(req.body.name, {lower: true});
    const organisationCheck = await Organisation.where({slug: slugname}).fetch();

    if(organisationCheck)
    {
        req.flash('error', req.__('flashes.organisations.duplicate-name'));
        return res.redirect(`/plans`);
    }

    let subs_exp_date = newDateYesterday();
    if(req.session.user.isAdmin)
    {
        let subs_exp_date = addDays(newDateNow(), plan.get('period'));
    }

    if(req.body.vat_number) {
        if(req.body.vat_number.length > 0) {
            req.body.hasVatNumber = 1;

            if(isNaN((parseInt(req.body.vat_number.substring(0, 2))))) {
                req.body.vat_number = req.body.vat_number.slice(2);
            }

            flash = await Organisation.ensureValidVatNumber(
                getCountryByCode(req.body.country),
                req.body.vat_number
            );

            // Check if a flash message was returned
            req.body.isValidVatNumber = typeof flash == 'string' ? 0 : 1;
        } else {
            req.body.isValidVatNumber = 0;
        }
    }
    else
    {
        req.body.hasVatNumber = 0;
        req.body.isValidVatNumber = 0;
        req.body.vat_number = null;
    }

    const organisation = await Organisation.forge({
        name: req.body.name,
        slug: slugname,
        country: req.body.country,
        address: req.body.address,
        plan_id: plan.get('id'),
        subs_exp_date: subs_exp_date,
        isActivated: true,
        activated_at: newDateNow(),
        vat_number: req.body.vat_number,
        hasVatNumber: req.body.hasVatNumber,
        isValidVatNumber: req.body.isValidVatNumber
    }).save();

    const organisationId = organisation.get('id');

    await OrganisationMember.forge({
        isAdmin: 1,
        stakeholder_id: stakeholder.get('id'),
        organisation_id: organisationId
    }).save().get('id');

    await mailController.sendEmail(mailController.emails.uponCreatingPaidOrganisation, stakeholder.get("email"), {
        stakeholder: stakeholder.toJSON(),
        organisation: organisation.toJSON(),
        host: req.get('host')
    });

    req.session.newPremiumOrganisationModalErrors = null;

    if(req.session.user.isAdmin)
    {
        req.flash('success', req.__('flashes.organisations.successfully-created', req.body.name));
        return res.redirect(`/organisations/${slugname}/edit`);
    }
    else
    {
        return res.redirect(`/plans/${plan.get("id")}/checkout/${slugname}`);
    }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const edit = async (req, res) => {
    req.body = sanitize(req.body);
    req.session['editOrganisationFormInput'] = req.body;
    if(!req.body.hasVatNumber) req.body.hasVatNumber = 0;

    if(req.session.user.isAdmin) {
        if(!req.body.isActivated) req.body.isActivated = 0;
        if(!req.body.isValidVatNumber) req.body.isValidVatNumber = 0;
    }


    const organisationInstance = await Organisation.where({slug: req.params.id}).fetch();
    if(!organisationInstance) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/');
    }

    const organisation = organisationInstance.toJSON();

    // Delete avatar if checked
    if (req.body.delete_avatar) {
        req.body.avatar = "";
        await fs.unlink(
            path.join(__dirname, `../public/uploads/${organisation.avatar}`),
            () => {}
        );
    }

    const updatedFields = getUpdatedFields(req.body, organisation);

    const errors = validate(updatedFields, Organisation.updateConstraints);
    if(errors) {
        req.flash('error', errors);
        return res.redirect(`/organisations/${req.params.id}/edit`);
    }

    // Ensure valid organisation name
    if(updatedFields.name) {
        const flash = await Organisation.ensureValidName(updatedFields.name);
        if(flash) {
            req.flash('error', flash);
            return res.redirect(`/organisations/${req.params.id}/edit`);
        }
    }

    let flash;
    if(updatedFields.vat_number) {
        // If a new vat number has been entered
        if(updatedFields.vat_number.length > 0) {
            if(!updatedFields.country && !organisation.country) {
                req.flash('error', req.__('flashes.organisations.country-before-vat'));
                return res.redirect(`/organisations/${req.params.id}/edit`);
            }
            // If has vat number is not checked or it is not yet present in organisation instance..
            req.body.hasVatNumber = 1;

            // If vat number starts with country code, remove it
            if(isNaN((parseInt(updatedFields.vat_number.substring(0, 2))))) {
                updatedFields.vat_number = updatedFields.vat_number.slice(2);
            }

            // Ensure vat number is valid
            flash = await Organisation.ensureValidVatNumber(
                getCountryByCode(updatedFields.country || organisation.country),
                updatedFields.vat_number
            );

            // Check if a flash message was returned
            updatedFields.isValidVatNumber = typeof flash == 'string' ? 0 : 1;
        } else {
            updatedFields.isValidVatNumber = 0;
        }
    }

    await organisationInstance.save(updatedFields, {patch: true});

    req.flash('success', req.__('flashes.organisations.successfully-updated', organisationInstance.get("name")));

    req.session['editOrganisationFormInput'] = null;
    return res.redirect(`/organisations/${organisation.slug}`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const destroy = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        res.redirect('/404');
    }

    const organisation = await Organisation.where({slug: req.params.id}).fetch();

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        return res.redirect('/404');
    }

    const tocs = await organisation.getTocs(organisation.get('id'));
    let deactivatedTocs = [];
    tocs.forEach(t => {
        if(!t.get('shouldBeDestroyed'))
            deactivatedTocs.push(t.get('name'));
    });

    await Promise.all(tocs.forEach(async toc => {
        if(!toc.get('shouldBeDestroyed')) {
            await toc.deactivate(toc);
        }
    }));

    const members = await organisation.getMembers(organisation.get('id'));
    await Promise.all(members.forEach(async member => {
        await member.destroy();
    }));

    await organisation.destroy();

    if(deactivatedTocs.length > 0) {
        req.flash('info', `${''.concat(...deactivatedTocs.join(', '))} have been deleted`);
        req.flash('success', req.__('flashes.organisations.destroy-confirmation-with-active-tocs'));
        return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
    }

    req.flash('success', req.__('flashes.organisations.destroy-confirmation-without-active-tocs'));
    if(req.session.user.isAdmin)
        return res.redirect(`/organisations`);

    return res.redirect('/')
}

/**
 * Extends trial for organisation account with 7 days
 * @param {Object} req
 * @param {Object} res
 */
const extendTrial = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        res.redirect('/404');
    }

    const organisation = await Organisation.where({slug: req.params.id}).fetch();

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        return res.redirect('/404');
    }

    if(organisation.get("extend_trial"))
    {
        req.flash('error', req.__('flashes.organisations.already-extended-trial'))
        return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
    }

    await organisation.save({
        subs_exp_date: new Date(+new Date + 604800000).toISOString().substring(0, 10), // Today + 7 days
        extend_trial: 1
    }, {patch: true});

    // Delete history of extension emails
    await SentEmail.where({organisation_id: organisation.get('id'), email_code: 6}).destroy();

    req.flash('success', req.__('flashes.organisations.extended-trial'));
    return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
}

/**
 * Deactivates organisation account and removes all of its members.
 * @param {Object} req
 * @param {Object} res
 */
const deactivate = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        res.redirect('/404');
    }

    const organisation = await Organisation.where({slug: req.params.id}).fetch();

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'))
        return res.redirect('/404');
    }

    const tocs = await organisation.getTocs(organisation.get('id'));
    let deactivatedTocs = [];
    tocs.forEach(t => {
        if(!t.get('shouldBeDestroyed'))
            deactivatedTocs.push(t.get('name'));
    });
    await Promise.all(tocs.forEach(async toc => {
        if(!toc.get('shouldBeDestroyed')) {
            await toc.deactivate(toc);
        }
    }));

    const members = await organisation.getMembers(organisation.get('id'));
    await Promise.all(members.forEach(async member => {
        await member.destroy();
    }));

    await organisation.save({
        isActivated: 0,
        deactivated_at: newDateNow()
    }, {patch: true});


    if(deactivatedTocs.length > 0) {
        req.flash('info', `${''.concat(...deactivatedTocs.join(', '))} have been deleted`);
        req.flash('success', req.__('flashes.organisations.deactivated-organisation-with-active-tocs', organisation.get('name')));
        return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
    }

    req.flash('success', req.__('flashes.organisations.deactivated-organisation-without-active-tocs'));
    return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
}

//TODO:
const upgradePlan = async (req, res) => {

}

module.exports = {
    index,
    createFree,
    createPremium,
    show,
    edit,
    destroy,
    showEdit,
    deactivate,
    extendTrial
};
