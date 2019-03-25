const differenceInDays = require('date-fns/difference_in_days');
const {newDateNow} = require('../helpers/dateHelper');
const bookshelf = require('../db');
const Toc = require('../models/toc');
const Organisation = require('../models/organisation');
const OrganisationMember = require('../models/organisationMember');
const TocMember = require('../models/tocMember');
const Plan = require('../models/plan');

/**
 * Displays a flash notification for an organisation, if user has a role in organisation and the organisation's subscription has reached it's maximum number of ToCs, has expired, or is to expire within a certain number of days.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const warnOrgForPlanPeriod = async (req, res, next) => {
    let organisationsQuery = bookshelf.knex.select("organisations.*", bookshelf.knex.raw("(SELECT COUNT (*) FROM tocs WHERE tocs.isActivated = 1 AND tocs.organisation_id = organisations.id) AS toc_amount")).from("organisations").where({slug: req.params.id}).first();

    const organisation = await organisationsQuery;

    if(!organisation)
        return next();

    const isMember = await OrganisationMember.where({
        stakeholder_id: req.session.user.id,
        organisation_id: organisation.id
    }).fetch();

    if(!isMember)
        return next();

    const plan = await Plan.where({id: organisation.plan_id}).fetch();

    const date1 = organisation.subs_exp_date;
    const date2 = new Date();
    date2.setHours(0, 0, 0, 0);
    var timeDiff = date1.getTime() - date2.getTime();
    var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

    if(plan.get("max_tocs") <= organisation.toc_amount)
        req.flash('error', req.__('flashes.plans.maximum-tocs-reached', organisation.slug));

    if(remainingDays < 0)
        req.flash('error', req.__('flashes.plans.plan-expired', organisation.slug));
    else if(remainingDays < process.env.REMIND_UPGRADE_PLAN_DURATION)
        req.flash('error', req.__('flashes.plans.plan-expiration', remainingDays === 1 ? "1 day" : (remainingDays + " days"), organisation.slug));
        
    return next();
};

// Displays a flash notification for a ToC, if user has a role the ToC or the ToC its organisation, and the ToC its organisation's subscription has expired or is to expire within a certain number of days.
const warnTocForPlanPeriod = async (req, res, next) => {
    if(!req.session.user) return next();

    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    const organisation = await Organisation.where({
        id: toc.get('organisation_id')
    }).fetch();

    const isOrganisationMember = await OrganisationMember.where({
        organisation_id: toc.get('organisation_id'),
        stakeholder_id: req.session.user.id
    }).fetch();

    const isTocMember = await TocMember.where({
        toc_id: toc.get('id'),
        stakeholder_id: req.session.user.id
    }).fetch();

    if(!isOrganisationMember || !isTocMember)
        return next();

    const plan = await Plan.where({id: organisation.get('plan_id')}).fetch();

    const date1 = organisation.get('subs_exp_date');
    const date2 = new Date();
    date2.setHours(0, 0, 0, 0);
    var timeDiff = date1.getTime() - date2.getTime();
    var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

    if(remainingDays < 0)
        req.flash('error', req.__('flashes.plans.plan-expired', organisation.get("slug")));

    else if(remainingDays < process.env.REMIND_UPGRADE_PLAN_DURATION) 
        req.flash('error', req.__('flashes.plans.plan-expiration', remainingDays === 1 ? "1 day" : (remainingDays + " days"), organisation.get("slug")));

    return next();
};

module.exports = {warnOrgForPlanPeriod, warnTocForPlanPeriod};
