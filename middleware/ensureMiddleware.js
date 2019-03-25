const Stakeholder = require('../models/stakeholder');
const Organisation = require('../models/organisation');
const TocMember = require('../models/tocMember');
const Toc = require('../models/toc');
const Plan = require('../models/plan');
const OrganisationMember = require('../models/organisationMember');
const {newDateNow} = require('../helpers/dateHelper');
const differenceInDays = require('date-fns/difference_in_days');
const addDays = require('date-fns/add_days');
const capitalize = require('lodash/capitalize');


/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * User needs to be a super admin
 */
const ensureSystemAdmin = (req, res, next) => {
    if(req.session.user && req.session.user.isAdmin) return next();

    req.flash('error', req.__('middleware.authorisation.no-permission'));
    return res.redirect(`/`);
};

/**
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * User needs to be calling upon himself (or a super admin)
 */
const ensureSessionUserOrSystemAdmin = (req, res, next) => {
    if(req.body.username == req.session.user.username ||
        req.params.username == req.session.user.username ||
        req.session.user.isAdmin) return next();

    req.flash('error', req.__('middleware.authorisation.no-permission'));
    return res.redirect(`/`);
};

/**
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * User needs to be activated (or a super admin)
 */
const ensureActivatedUserOrSystemAdmin = async (req, res, next) => {
    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();

    if(!stakeholder) {
        req.flash('error', req.__('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    if(!req.session.user)
        return next();

    // Only admin can see accounts that are not active
    if(!(stakeholder.get('isActivated')) && !(req.session.user.isAdmin)) {
        req.flash('error', req.__('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }
    return next();
};

/**
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * User needs to be logged out (or a super admin)
 */
const ensureLoggedoutUserOrSystemAdmin = async (req, res, next) => {
    if(req.session.user && !req.session.user.isAdmin) {
        req.flash('error', req.__('login-and-signup.already-logged-in'));
        return res.redirect('/');
    }
    return next();
};

/**
 * Allow only to route if user is admin of this organisation, or system admin
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * User needs to be an admin of an organisation (or a super admin)
 */
//TODO: It's confusing that isAdmin exists in user (stakeholder) table as well as in an organisationmember. Perhaps rename in database in the second case to isOrgAdmin? (is kind of risky that this goes wrong somewhere and you forget to rename it somewhere in the code...)
//TODO: Could be easier ?? check ensureTocAdminOrSystemAdmin method below
const ensureOrganisationMemberOrSystemAdmin = async (req, res, next) => {
    if(req.session.user.isAdmin) return next();

    let organisation = null;

    if(req.params.id)
    {
        organisation = await Organisation.query({ where: {slug: req.params.id }}).fetch();
    }
    else
    {
        organisation = await Organisation.query({where: {id: req.body.organisation_id}}).fetch();
    }

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/404');
    }

    const membersInstances = await organisation.getMembers(organisation.get('id'));
    const members = membersInstances.toJSON();

    /**
     * Check if stakeholder is one of the members of this organisation,
     * and if he is admin.
     */
    const isMember = members.some(m => {
        const member = m.stakeholder_id == req.session.user.id;
        if(member && m.isAdmin)
            res.locals.isOrganisationAdmin = 1;
        return member;
    });

    if(!isMember) {
        req.flash('error', req.__('middleware.authorisation.no-member1'));
        return res.redirect(`/stakeholders/${req.session.user.username}`);
    }

    if(!res.locals.isOrganisationAdmin) {
        req.flash('error', req.__('middleware.authorisation.no-orgadmin-but-invited'));
        return res.redirect(`/stakeholders/${req.session.user.username}`);
    }

    return next();
};

/**
 * Allow only to view activated organisations
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * User needs to be an admin of an organisation (or a super admin)
 */
const ensureOrganisationAdminOrSystemAdmin = async (req, res, next) => {
    if(req.session.user.isAdmin) return next();

    let organisation = null;

    if(req.params.slug)
    {
        organisation = await Organisation.query({ where: {slug: req.params.slug }}).fetch();
    }
    else if(req.params.id)
    {
        organisation = await Organisation.query({ where: {slug: req.params.id }}).fetch();
    }
    else
    {
        organisation = await Organisation.query({where: {id: req.body.organisation_id}}).fetch();
    }

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/404');
    }

    const organisation_member = await OrganisationMember.where({
        organisation_id: organisation.get("id"),
        stakeholder_id: req.session.user.id,
        isAdmin: 1
    }).fetch();

    if(!organisation_member)
    {
        req.flash('error', __('flashes.roles.not-administrator-of-organisation'));
        return res.redirect(`/stakeholders/${req.session.user.username}`);
    }

    return next();
};

/**
 * Allow only to view activated organisations
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * User needs to be an organisation admin
 */
const ensureOrganisationAdmin = async (req, res, next) => {
    let organisation = null;

    if(req.params.slug)
    {
        organisation = await Organisation.query({ where: {slug: req.params.slug }}).fetch();
    }

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/404');
    }

    const organisation_member = await OrganisationMember.where({
        organisation_id: organisation.get("id"),
        stakeholder_id: req.session.user.id,
        isAdmin: 1
    }).fetch();

    if(!organisation_member)
    {
        req.flash('error', __('flashes.roles.not-administrator-of-organisation'));
        return res.redirect(`/stakeholders/${req.session.user.username}`);
    }

    return next();
};

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * User needs to have an invitation to become an admin in an organisation
 */
const ensureInvitedAsOrganisationAdmin = async (req, res, next) => {
    const member = OrganisationMember.where({id: req.params.id}).fetch();

    if(!member || !member.get('activation_hash')) {
        req.flash('error', req.__('middleware.authorisation.no-member2'));
        return res.redirect('/');
    }

    return next();
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * User needs to have an invitation for a role in the ToC
 */
const ensureInvitedAsTocRole = async (req, res, next) => {
    if(!req.query.role) {
        req.flash('error', req.__('flashes.roles.role-not-specified'));
        return res.redirect('/');
    }

    if(!['admin', 'moderator', 'member'].includes(req.query.role)) {
        req.flash('error', req.__('flashes.roles.middleware.role-does-not-exist'));
        return res.redirect('/');
    }

    const member = await TocMember.where({id: req.params.id}).fetch();

    if(!member) {
        req.flash('error', req.__('flashes.roles.middleware.no-role-organisation'));
        return res.redirect('/');
    }

    if(member.get(`${req.query.role}_activation_hash`) && !member.get(`is${capitalize(req.query.role)}`))
        return next();

    req.flash('error', req.__('flashes.roles.middleware.not-invited-or-already-got-role', req.query.role, req.query.role));
    return res.redirect('/');
};

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * User needs to have a role in the ToC or needs to be an admin of the ToC's organisation
 */
const ensureHasRoleInTocOrOrganisationAdmin = async (req, res, next) => {
    if(req.session.user.isAdmin) return next();

    if(!req.params.id) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/');
    }

    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    if(toc.get("visibility") == 1)
    {
        return next();
    }
    else
    {
        const role = await TocMember.where({
            stakeholder_id: req.session.user.id,
            toc_id: toc.get("id")
        }).fetch();

        if(role && (role.get('isAdmin') ||
            role.get('isModerator') ||
            role.get('isMember')))
            return next();

        const orgAdmin = await OrganisationMember.where({
            stakeholder_id: req.session.user.id,
            organisation_id: toc.get('organisation_id'),
            isAdmin: 1
        }).fetch();

        if(orgAdmin)
            return next();

        req.flash('error', req.__('flashes.roles.middleware.no-role-toc'));
        return res.redirect(`/tocs`);
    }
};

/**
 * User must be admin of the ToC (or super admin)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const ensureTocAdminOrSystemAdmin = async (req, res, next) => {
    if(req.session.user.isAdmin) return next();

    let toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    const member = await TocMember.where({
        stakeholder_id: req.session.user.id,
        toc_id: toc.get('id')
    }).fetch();

    if(!member || !member.get('isAdmin')) {
        req.flash('error', req.__('middleware.authorisation.no-rights'));
        return res.redirect(`/tocs/${toc.get('id')}`);
    }

    return next();
};


/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * Organisation needs to be activated (or super admin). Allow only to view activated organisations.
 */
const ensureActivatedOrganisationOrSystemAdmin = async (req, res, next) => {
    if(req.session.user.isAdmin) return next();
    let organisation = null;

    if(req.params.id)
    {
        organisation = await Organisation.query({ where: { slug: req.params.id }}).fetch();
    }
    else
    {
        organisation = await Organisation.query({where: {id: req.body.organisation_id}}).fetch();
    }

    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/404');
    }

    if(!organisation.get('isActivated')) {
        req.flash('error', req.__('flashes.organisations.de-active'));
        return res.redirect('/404');
    }

    return next();
};

/**
 * @private
 * @param {Integer} period
 * @param {Date} expirationDate
 * Organisation's subscription plan must not be expired
 */
const isPlanExpirationDateValid = (period, expirationDate) =>
    (differenceInDays(
        expirationDate,
        newDateNow()
    ) > 0);

/**
 * @private
 * @param {Integer} existingTocCount
 * @param {Integer} maxTocCount
 * Organisation's subscription must not have reached it's maximum number of ToCs yet
 */
const hasRemainingTocs = (currentTocCount, maxTocCount) => {
    return (maxTocCount > currentTocCount);
};

/**
 * Organisation's subscription must still have remaining days and must not have reached it's maximum number of ToCs yet
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const ensureValidPlanOrSystemAdmin = async (req, res, next) => {
    if(req.session.user.isAdmin) return next();

    let organisation;
    if(req.params.id) {
        // Get by toc
        const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();
        organisation = await toc.getOrganisation(
            toc.get('organisation_id'),
            Organisation
        );
    } else if (req.body.organisation_id) {
        // Get by organisation
        organisation = await Organisation.where({id: req.body.organisation_id}).fetch();
    }
    const plan = await Plan.where({id: organisation.get('plan_id')}).fetch();

    // Check if organisation plan exp date is still valid
    const isExpirationDateValid = isPlanExpirationDateValid(
        plan.get('period'),
        organisation.get('subs_exp_date')
    );
    if(!isExpirationDateValid) {
        req.flash('error', req.__('flashes.plans.expired', organisation.get("slug")));
        return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
    }

    if(!req.query.deactivate && !(req.query.deactivate == 'true')) {
        const currentTocCount = await Toc.where({organisation_id: organisation.get('id'), isActivated: 1}).count('*');
        const organisationHasRemainingTocs = hasRemainingTocs(currentTocCount, plan.get('max_tocs'));
        if(!organisationHasRemainingTocs) {
            req.flash('error', req.__('flashes.plans.maximum-tocs-reached', organisation.get('slug')));
            return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
        }
    }

    return next();
};

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * ToC must be activated or user must have an active role in the ToC (or super admin)
 */
const ensureIsActiveTocOrAdminRole = async (req, res, next) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    if(req.session.user.isAdmin) return next();

    if(!toc.get('isActivated')) {
        const member = await TocMember.where({
            stakeholder_id: req.session.user.id,
            toc_id: toc.get('id')
        }).fetch();

        if(!member) {
            req.flash('error', req.__('flashes.tocs.deactivate-toc'));
            return res.redirect('/404');
        }

        req.isTocMember = true;
    }

    return next();
};

/**
 * Ensure that person editing is either:
 * 1. A ToC admin
 * 2. Stakeholder to edit is session user
 * 3. Super admin
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const ensureEditTocRoleRights = async (req, res, next) => {
    if(!req.params.id || !req.params.username) {
        req.flash('error', req.__('flashes.not-found'));
        return res.redirect('/404');
    }

    if(req.session.user.isAdmin) return next();

    const toc = await Toc.where({ uuid: req.params.id }).fetch();
    const sessionMember = await TocMember.where({
        toc_id: toc.get("id"),
        stakeholder_id: req.session.user.id
    }).fetch();

    if(!sessionMember) {
        req.flash('error', req.__('middleware.authorisation.no-rights'));
        return res.redirect(`/tocs/${req.params.id}`);
    }

    if(sessionMember.get('isAdmin'))
        return next();

    // TODO: Is next line secure? That is, can params.username refer to something else such as a toc or organisation, of which the username coincidentially matches the username of a user...?
    if(req.params.username == req.session.user.username)
        return next();

    req.flash('error', req.__('middleware.authorisation.no-rights'));
    return res.redirect(`/tocs/${req.params.id}`);
};

module.exports = {
    ensureSystemAdmin,   
    ensureSessionUserOrSystemAdmin,
    ensureActivatedUserOrSystemAdmin,
    ensureOrganisationMemberOrSystemAdmin,
    ensureOrganisationAdminOrSystemAdmin,
    ensureOrganisationAdmin,
    ensureActivatedOrganisationOrSystemAdmin,
    ensureInvitedAsOrganisationAdmin,
    ensureInvitedAsTocRole,
    ensureTocAdminOrSystemAdmin,
    ensureIsActiveTocOrAdminRole,
    ensureValidPlanOrSystemAdmin,
    ensureHasRoleInTocOrOrganisationAdmin,
    ensureEditTocRoleRights,
    hasRemainingTocs,
    ensureLoggedoutUserOrSystemAdmin
};
