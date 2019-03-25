const bookshelf = require('../db');
const fs = require('fs');
const path = require('path');
const capitalize = require('lodash/capitalize');
const Plan = require('../models/plan');
const Stakeholder = require('../models/stakeholder');
const Organisation = require('../models/organisation');
const OrganisationMember = require('../models/organisationMember');
const TocMember = require('../models/tocMember');
const Toc = require('../models/toc');
const validate = require('validate.js');
// const {removeURLParameter} = require('../helpers/urlHelper')
const {newDateNow} = require('../helpers/dateHelper');
const {isHashMatching, encrypt} = require('../helpers/hashing');
const sanitize = require('../helpers/sanitize');
const {
    generateActivationToken,
    isTokenLegitAndNotExpired
} = require('../services/tokenService');
const {hasRemainingTocs} = require('../middleware/ensureMiddleware');
const {
    inviteStakeholderAsOrganisationAdmin,
    inviteStakeholderAsTocRole,
    reinviteStakeholderAsOrganisationAdmin,
    reinviteStakeholderAsTocRole
} = require('../services/invitationService');

const sendAccountValidationEmail = require('../mailers/sendAccountValidationEmail');
const sendTocRoleRemovalEmail = require('../mailers/sendTocRoleRemovalEmail');
const sendOrganisationRoleRemovalEmail = require('../mailers/sendOrganisationRoleRemovalEmail');
const sendOrganisationRoleDeclineEmail = require('../mailers/sendOrganisationRoleDeclineEmail');
const sendTocRoleDeclineEmail = require('../mailers/sendTocRoleDeclineEmail');
const getUpdatedFields = require('../helpers/getUpdatedFields');
const {countriesList} = require('../helpers/countriesList');

const firebase = require('./firebaseController');

/**
 *
 * @param {*} req
 * @param {*} res
 */
const index = async (req, res) => {
    // When there are multiple query parameters of the same type
    // TODO: Remove first sortBy from url
    // TODO: Handle unknown query params
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
        Stakeholder.searchables.map((searchable, i) => {
            if(i == 0)
            {
                search += `stakeholders.${searchable} LIKE ?`
            }
            else
            {
                search += ` OR stakeholders.${searchable} LIKE ?`
            }

            bindings.push(`%${req.query.search}%`);
        });
    }

    if(search !== "")
    {
        raw += "(" + search + ")";
    }

    let stakeholdersCount = await bookshelf.knex("stakeholders").whereRaw(raw, bindings).count("id as count");
    let stakeholdersQuery = bookshelf.knex.select("stakeholders.*",
        bookshelf.knex.raw("(SELECT COUNT (*) FROM toc_members WHERE stakeholder_id = stakeholders.id AND isModerator = 1) AS isTocModerator"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM toc_members WHERE stakeholder_id = stakeholders.id AND isMember = 1) AS isTocMember"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM toc_members WHERE stakeholder_id = stakeholders.id AND isAdmin = 1) AS isTocAdmin"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM organisation_members WHERE stakeholder_id = stakeholders.id AND isAdmin = 1) AS isOrganisationAdmin")
    ).from("stakeholders").whereRaw(raw, bindings);

    const sortOrder = (req.query.sortOrder === "DESC") ? "DESC" : "ASC";
    if(req.query.sortBy)
    {
        if(req.query.sortBy === "isActivated")
        {
            stakeholdersQuery.orderByRaw("ISNULL(stakeholders.activated_at), stakeholders.activated_at " + sortOrder);
        }
        else
        {
            stakeholdersQuery.orderBy(req.query.sortBy, sortOrder);
        }
    }

    stakeholdersQuery.limit(pagination.pageSize).offset(pagination.pageSize * (pagination.page - 1));

    const stakeholders = await stakeholdersQuery;

    pagination.rowCount = stakeholdersCount[0].count;
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

    res.render('stakeholders/index', {
        title: __('views.page-titles.stakeholders-index'),
        stakeholders,
        pagination: pagination,
        currentSort: req.query.sortBy ? req.query.sortBy : '',
        sortOrder: req.query.sortOrder ? req.query.sortOrder : 'ASC',
        reverseSortOrder: req.query.sortOrder === "ASC" ? "DESC" : "ASC",
        url,
        baseUrl
    });
}

/**
 * @public
 * Show stakeholder account by id
 * @param {*} req
 * @param {*} res
 * @returns {Void}
 */
const show = async (req, res) => {
    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
    let userOrganisations;
    let userTocs;
    let userTocRoles;

    // Get organisations
    if(req.session.user) {
        const user = await Stakeholder.where({username: req.session.user.username}).fetch();
        userOrganisations = await user.getOrganisations(user.get('id'), (user.get('isAdmin') ? null : 1));
        userTocs = await user.getTocs(user.get('id'));
    }

    // Get all user roles in toc
    if(req.session.user && (req.session.user.id == stakeholder.get('id') || req.session.user.isAdmin)) {
        userTocRoles = await TocMember.where({'stakeholder_id': stakeholder.get('id')}).fetchAll();
    }

    res.render('stakeholders/profile', {
        title: `Stakeholder ${stakeholder.get('full_name')}`,
        stakeholder: stakeholder.toJSON(),
        userOrganisations: userOrganisations ? userOrganisations : [],
        userTocs: userTocs ? userTocs : [],
        userTocRoles: userTocRoles ? userTocRoles.toJSON() : []
    });
}

/**
 * @public
 * Show form to edit stakeholder if
 * current user id is the same as the requested
 * stakeholder
 * @param {*} req
 * @param {*} res
 * @returns {Void}
 */
const showEdit = async (req, res) => {
    if(!req.params.username) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    res.render('stakeholders/edit', {
        title: `Edit ${stakeholder.get('full_name')}`,
        stakeholder: stakeholder.toJSON(),
        oldInput: req.session.editStakeholderFormInput || {},
        validations: Stakeholder.updateConstraints
    });
}

/**
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Void}
 */
const showOrganisations = async (req, res) => {
    if(!req.params.username) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    const user = await Stakeholder.where({username: req.session.user.username}).fetch();
    const organisations = await stakeholder.getOrganisations(stakeholder.get('id'), !user.get('isAdmin'));
    const plans = await Plan.fetchAll();

    // Use promise.all to resolve async iteration
    await Promise.all(organisations.map(async (org, i) => {
        const members = await OrganisationMember.where({organisation_id: org.id}).fetchAll();
        const plan = await Plan.where({id: org.plan_id}).fetch();
        organisations[i].plan = plan.get('name');
        organisations[i].memberCount = members.toJSON().length;
    }));

    res.render('stakeholders/organisations', {
        title: `${stakeholder.get('full_name')} organisations`,
        stakeholder: stakeholder.toJSON(),
        organisations,
        countriesList,
        newFreeOrganisationModalErrors:
            req.session.newFreeOrganisationModalErrors ?
                req.session.newFreeOrganisationModalErrors :
                null,
        newPremiumOrganisationModalErrors:
            req.session.newPremiumOrganisationModalErrors ?
                req.session.newPremiumOrganisationModalErrors :
                null,
        plans: plans.toJSON()
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const showTocs = async (req, res) => {
    // Todo fix this entire function to use less loops / waiting etc

    if(!req.params.username) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    const user = await Stakeholder.where({username: req.session.user.username}).fetch();
    const stakeholderTocs = await stakeholder.getTocs(stakeholder.get('id'));
    const allOrganisations = await stakeholder.getOrganisations(stakeholder.get('id'), (user.get('isAdmin') ? null : 1));

    const organisations = [];

    // Get all tocs by organisation
    await Promise.all(
        stakeholderTocs.map(async (toc, i) => {
            // Ensure no duplicates
            const org = await Organisation.where({id: toc.organisation_id}).fetch();
            if(!organisations.some(o => o.id == org.get('id')))
                organisations.push(org.toJSON());
        })
    );

    // Populate organisation resource with corresponding tocs and plan
    await Promise.all(
        organisations.map(async (organisation, i) => {
            const plan = await Plan.where({
                id: organisation.plan_id
            }).fetch();

            organisation.plan = {
                name: plan.get('name')
            }

            const tocs = stakeholderTocs.filter(toc => toc.organisation_id == organisation.id);

            // Populate every toc with this stakeholder roles
            await Promise.all(tocs.map(async (toc) => {
                const member = await TocMember.where({
                    toc_id: toc.id,
                    stakeholder_id: stakeholder.get('id')
                }).fetch();

                toc.roles = {
                    isAdmin: member.get('isAdmin'),
                    isModerator: member.get('isModerator'),
                    isMember: member.get('isMember'),
                }
            }));

            const organisationMember = await OrganisationMember.where({isAdmin: 1, stakeholder_id: stakeholder.get("id"), organisation_id: organisation.id}).fetch();

            organisation.tocs = tocs;
            organisation.isAdmin = (organisationMember) ? true : false;
            organisation.isExpired = (organisation.subs_exp_date < new Date());
            organisation.hasRemainingTocs = hasRemainingTocs(
                await Toc.where({organisation_id: organisation.id, isActivated: 1}).count('*'),
                plan.get('max_tocs')
            );
        })
    );

    res.render('stakeholders/tocs', {
        title: `${stakeholder.get('full_name')} tocs`,
        stakeholder: stakeholder.toJSON(),
        tocs: stakeholderTocs,
        organisations,
        allOrganisations
    });
}

/**
 * Validate and edit stakeholder
 * @param {Object} req
 * @param {Object} res
 * @returns {Function} Redirect
 */
const edit = async (req, res) => {
    req.body = sanitize(req.body);
    req.session['editStakeholderFormInput'] = req.body;
    // Validate request body
    let errors = validate(req.body, Stakeholder.mustHaveConstraints);
    if (errors) {
        req.flash('error', errors);
        return res.redirect(`/stakeholders/${req.params.username}/edit`);
    };

    // Populate admin checkboxes when not checked because checkboxes are retarded
    if(req.session.user.isAdmin) {
        if(!req.body.isActivated) req.body.isActivated = 0;
        if(!req.body.isVerified) req.body.isVerified = 0;
        if(!req.body.isAdmin) req.body.isAdmin = 0;
        if(!req.body.hasUsedFreeTrial) req.body.hasUsedFreeTrial = 0;
    }

    const stakeholderModelInstance = await Stakeholder.where({username: req.params.username}).fetch();
    if(!stakeholderModelInstance) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/');
    }
    const stakeholder = stakeholderModelInstance.toJSON();

    // Handle request for new password
    if(req.body.password) {
        if(req.body.password != req.body.password_secure) {
            req.flash('error', __('flashes.update.passwords-dont-match'));
            return res.redirect(`/stakeholders/${req.params.username}/edit`);
        }

        const errors = validate.single(req.body.password, {
            length: {
                minimum: 8,
                message: 'Password must be at least 8 characters'
            }
        });

        // If password input is invalid, return with flash
        if(errors) {
            // TODO: (int): Onderstaande regel nog aanpassen in kader van internationalisation?
            req.flash('error', errors);
            return res.redirect(`/stakeholders/${req.params.username}/edit`);
        }

        // Encrypt if new password
        req.body.password_hash = await encrypt(req.body.password);
    }

    // Delete avatar if checked
    if (req.body.delete_avatar) {
        req.body.avatar = "";
        await fs.unlink(path.join(__dirname, `../public/uploads/${stakeholder.avatar}`), () => {});

        if(stakeholder.id == req.session.user.id)
            req.session.user.avatar = null;
    }

    // Find out which fields have been edited
    const updatedFields = getUpdatedFields(req.body, stakeholder);

    errors = validate(updatedFields, Stakeholder.updateConstraints);
    if (errors) {
        req.flash('error', errors);
        return res.redirect(`/stakeholders/${req.params.username}/edit`);
    };

    // Handle new email
    if(updatedFields.new_email && updatedFields.new_email !== stakeholder.email) {
        const errors = validate.single(updatedFields.new_email, {
            email: {
                message: 'Email is not valid'
            },
            lowercase: {
                message: 'Email must be lower case characters only'
            }
        });

        // Ensure valid email, return flash if invalid
        if(errors) {
            // TODO: (int): Onderstaande regel nog aanpassen in kader van internationalisation?
            req.flash('error', errors);
            return res.redirect(`/stakeholders/${req.params.username}/edit`);
        }

        const flash = await Stakeholder.ensureValidEmail(updatedFields.new_email);
        if(flash) {
            // TODO: (int): Onderstaande regel nog aanpassen in kader van internationalisation?
            req.flash('error', flash);
            return res.redirect(`/stakeholders/${req.params.username}/edit`);
        }

        // Generate new token for new email address
        const token = await generateActivationToken(stakeholder.id);

        await sendAccountValidationEmail(
            updatedFields.new_email,
            token,
            req.get('host'),
            updatedFields.name || stakeholder.full_name,
            { update: true }
        );
    }

    // Validate username/email only when changed
    let flash;
    if(updatedFields.username) flash = await Stakeholder.ensureValidUsername(updatedFields.username);
    if(flash) {
        // TODO: (int): Volgende regel in kader van internationalisatie?
        req.flash('error', flash);
        return res.redirect(`/stakeholders/${req.params.username}/edit`);
    }

    updatedFields.custom_updated_at = newDateNow();
    if(updatedFields.isActivated) {
        updatedFields.activated_at = newDateNow();
    }
    const updatedStakeholder = await stakeholderModelInstance.save(updatedFields, { patch: true });

    // Populate locals with updated stakeholder to update views
    if(stakeholder.id == req.session.user.id) req.session.user = updatedStakeholder;

    if(updatedFields.new_email && updatedFields.new_email !== stakeholder.email) {
        req.flash('success', __('flashes.activation.activation-email-sent'));
    } else {
        req.flash('success', __('flashes.stakeholders.successful-update'));
    }

    req.session['editStakeholderFormInput'] = null;
    return res.redirect(`/stakeholders/${updatedFields.username ? updatedFields.username : req.params.username}`);
}

/**
 * @public
 * Deactivates stakeholder,
 * removes him from all organisations and
 * clears session.
 * @param {Object} req
 * @param {Object} res
 * @returns {Function} Redirect
 */
const deactivate = async (req, res) => {
    if(!req.params.username) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
    const organisationMembersByStakeholder = await OrganisationMember.where({stakeholder_id: stakeholder.get('id')}).fetchAll();
    const tocAdminsByStakeholder = await TocMember.where({stakeholder_id: stakeholder.get('id')}).fetchAll();

    // Have a promise list for the two checks (if last organisation administrator and if last toc administrator)
    const promises = [];

    if(organisationMembersByStakeholder) {
        // Add organisation administrator test to promise list
        promises.push(new Promise(function(resolve, reject)
        {
            // Since all organisation members are fetched async
            // Create a list of promises for all organisations the stakeholder is a part of
            // Wait for all to finish and resolve or reject.
            Promise.all(organisationMembersByStakeholder.map((member) => {
                return new Promise(async function(resolve, reject){
                    const membersByOrganisationCount = await OrganisationMember
                        .where({ isAdmin: 1, organisation_id: member.get('organisation_id')})
                        .count('*');

                    if(membersByOrganisationCount <= 1 && member.get('isAdmin')) {
                        req.flash('error', req.__('flashes.stakeholders.last-organisation-admin'));

                        return reject(`/stakeholders/${req.params.username}/organisations`);
                    }

                    return resolve();
                })
            })).then(function()
            {
                return resolve();
            }).catch(function(redirect)
            {
                return reject(redirect);
            });
        }));
    }

    if(tocAdminsByStakeholder) {
        // Add toc administrator test to promise list
        promises.push(new Promise(function(resolve, reject)
        {
            // Since all toc members are fetched async
            // Create a list of promises for all tocs the stakeholder is a part of
            // Wait for all to finish and resolve or reject.
            Promise.all(tocAdminsByStakeholder.map((member) => {
                return new Promise(async function(resolve, reject)
                {
                    const adminsByTocCount = await TocMember
                        .where({
                            toc_id: member.get('toc_id'),
                            isAdmin: 1
                        })
                        .count('*');

                    if(adminsByTocCount <= 1 && member.get('isAdmin')) {
                        req.flash('error', req.__('flashes.stakeholders.last-toc-admin'));

                        return reject(`/stakeholders/${req.params.username}/tocs`);
                    }

                    return resolve();
                });
            })).then(function()
            {
                return resolve();
            }).catch(function(redirect)
            {
                return reject(redirect);
            });
        }));
    }

    // Test both cases
    await Promise.all(promises).then(async function()
    {
        // Both passed, not last administrator. Deactivate user.
        await stakeholder.save({
            isActivated: false,
            deactivated_at: newDateNow()
        }, { patch: true })

        /* If this user is still logged in, clear
        * session and cookies
        */
        if(req.params.username == req.session.user.username) {
            if(req.cookies.token) res.clearCookie('token');
            req.session.token = null;
            req.session.user = null;
        };

        req.flash('success', __('flashes.stakeholders.deactivated-stakeholder'));
        return res.redirect('/');
    }).catch(function(redirect)
    {
        // One or both tests failed. Redirect to the (first) error page.
        return res.redirect(redirect);
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const destroy = async (req, res) => {
    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
    const organisationMembersByStakeholder = await OrganisationMember.where({stakeholder_id: stakeholder.get('id')}).fetchAll();
    const tocAdminsByStakeholder = await TocMember.where({stakeholder_id: stakeholder.get('id')}).fetchAll();

    // Have a promise list for the two checks (if last organisation administrator and if last toc administrator)
    const promises = [];

    if(organisationMembersByStakeholder) {
        // Add organisation administrator test to promise list
        promises.push(new Promise(function(resolve, reject)
        {
            // Since all organisation members are fetched async
            // Create a list of promises for all organisations the stakeholder is a part of
            // Wait for all to finish and resolve or reject.
            Promise.all(organisationMembersByStakeholder.map((member) => {
                return new Promise(async function(resolve, reject){
                    const membersByOrganisationCount = await OrganisationMember
                        .where({ isAdmin: 1, organisation_id: member.get('organisation_id')})
                        .count('*');

                    if(membersByOrganisationCount <= 1 && member.get('isAdmin')) {
                        req.flash('error', req.__('flashes.organisations.last-organisation-admin', stakeholder.get('full_name')));

                        return reject(`/stakeholders/${req.params.username}/organisations`);
                    }

                    return resolve();
                })
            })).then(function()
            {
                return resolve();
            }).catch(function(redirect)
            {
                return reject(redirect);
            });
        }));
    }

    if(tocAdminsByStakeholder) {
        // Add toc administrator test to promise list
        promises.push(new Promise(function(resolve, reject)
        {
            // Since all toc members are fetched async
            // Create a list of promises for all tocs the stakeholder is a part of
            // Wait for all to finish and resolve or reject.
            Promise.all(tocAdminsByStakeholder.map((member) => {
                return new Promise(async function(resolve, reject)
                {
                    const adminsByTocCount = await TocMember
                        .where({
                            toc_id: member.get('toc_id'),
                            isAdmin: 1
                        })
                        .count('*');

                    if(adminsByTocCount <= 1 && member.get('isAdmin')) {
                        req.flash('error', req.__('flashes.tocs.last-toc-member', stakeholder.get('full_name')));

                        return reject(`/stakeholders/${req.params.username}/tocs`);
                    }

                    return resolve();
                });
            })).then(function()
            {
                return resolve();
            }).catch(function(redirect)
            {
                return reject(redirect);
            });
        }));
    }

    // Test both cases
    await Promise.all(promises).then(async function()
    {
        // Both passed, not last administrator. Delete user.
        await OrganisationMember.where({stakeholder_id: stakeholder.get('id')}).destroy();
        await TocMember.where({stakeholder_id: stakeholder.get('id')}).destroy();
        await stakeholder.destroy();

        /* If this user is still logged in, clear
        * session and cookies
        */
        if(req.params.username == req.session.user.username) {
            if(req.cookies.token) res.clearCookie('token');
            req.session.token = null;
            req.session.user = null;
        };

        req.flash('success', __('flashes.stakeholders.confirm-destroy'));
        return res.redirect('/stakeholders');
    }).catch(function(redirect)
    {
        // One or both tests failed. Redirect to the (first) error page.
        return res.redirect(redirect);
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @returns {Function} Redirect
 */
const reinviteAsAdminToOrganisation = async (req, res) => {
    let organisation, stakeholder, redirect;

    if(req.params.username && req.params.id) {
        organisation = await Organisation.where({slug: req.params.id}).fetch();
        stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
        redirect = `/organisations/${organisation.get('slug')}/edit`;
    } else {
        req.flash('error', __('flashes.unknown-problem'));
        return res.redirect('/404');
    }

    if(!organisation) {
        req.flash('error', __('flashes.organisations.not-found'));
        return res.redirect(redirect);
    }

    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect(redirect);
    }

    const membersInstances = await organisation.getMembers(organisation.get('id'));
    const members = membersInstances.toJSON();

    // If this stakeholder is already member, return
    const isAlreadyMember = members.some(member => member.stakeholder_id == stakeholder.id && member.isAdmin === 1);
    if(isAlreadyMember) {
        req.flash('error', __('flashes.roles.invitation.already-admin-organisation'));
        return res.redirect(redirect);
    }

    // If this organisation has too much admins, return
    if(members.length >= process.env.MAX_ORGANISATION_MEMBERS) {
        req.flash('error', req.__('flashes.organisations.no-more-admins', process.env.MAX_ORGANISATION_MEMBERS));
        return res.redirect(redirect);
    }

    await reinviteStakeholderAsOrganisationAdmin(
        stakeholder,
        organisation,
        req.get('host'),
        req.session.user.username
    );

    req.flash('success', req.__('flashes.roles.invitation.succesfully-invited-org-admin', stakeholder.get('full_name'), organisation.get('name')));
    return res.redirect(redirect);
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @returns {Function} Redirect
 */
const inviteAsAdminToOrganisation = async (req, res) => {
    let organisation, stakeholder, redirect;

    if(req.params.username && req.body.organisation_id) {
        organisation = await Organisation.where({id: req.body.organisation_id}).fetch();
        stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
        redirect = `/stakeholders/${req.params.username}`;
    } else if (req.body.email && req.params.id) {
        organisation = await Organisation.where({slug: req.params.id}).fetch();
        stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
        redirect = `/organisations/${req.params.id}`;
    } else {
        req.flash('error', __('flashes.unknown-problem'));
        return res.redirect('/404');
    }

    if(!organisation) {
        req.flash('error', __('flashes.organisations.not-found'));
        return res.redirect(redirect);
    }

    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect(redirect);
    }

    const membersInstances = await organisation.getMembers(organisation.get('id'));
    const members = membersInstances.toJSON();

    // If this stakeholder is already member, return
    const isAlreadyMember = members.some(member => member.stakeholder_id == stakeholder.id);
    if(isAlreadyMember) {
        req.flash('error', __('flashes.roles.invitation.already-admin-organisation'));
        return res.redirect(redirect);
    }

    // If this organisation has too much admins, return
    if(members.length >= process.env.MAX_ORGANISATION_MEMBERS) {
        req.flash('error', req.__('flashes.organisations.no-more-admins', process.env.MAX_ORGANISATION_MEMBERS));
        return res.redirect(redirect);
    }

    await inviteStakeholderAsOrganisationAdmin(
        stakeholder,
        organisation,
        req.get('host'),
        req.session.user.username
    );

    req.flash('success', req.__('flashes.roles.invitation.succesfully-invited-org-admin', stakeholder.get('full_name'), organisation.get('name')));
    return res.redirect(redirect);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const addTocRole = async (req, res) => {
    const member = await TocMember.where({id: req.params.id}).fetch();

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(),
        member.get(`${req.query.role}_activation_hash`),
        member.get(`${req.query.role}_activation_sent_at`),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) {
        req.flash('error', __('flashes.roles.token.illegitimate-token'));
        return res.redirect('/');
    }

    await member.save({
        [`is${capitalize(req.query.role)}`]: 1
    }, {patch: true});

    // Load the TOC
    const toc = await Toc.where({id: member.get('toc_id')}).fetch();

    // Add the member to Firebase.
    firebase.database().ref('/projects/' + toc.get('uuid') + '/people/' + member.get('stakeholder_id')).set({
        permissions : {
            read: true,
            write: true,
        }
    });

    req.flash('success', req.__('flashes.tocs.successfully-accepted-role', req.query.role));
    return res.redirect(`/tocs/${toc.get('uuid')}`);
}

const declineTocRole  = async (req, res) => {
    const member = await TocMember.where({id: req.params.id}).fetch();

    const toc = await Toc.where({id: member.get('toc_id')}).fetch();

    const invitor = await Stakeholder.where({username: req.query.invitor}).fetch();

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(),
        member.get(`${req.query.role}_activation_hash`),
        member.get(`${req.query.role}_activation_sent_at`),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) {
        req.flash('error', __('flashes.roles.token.illegitimate-token'));
        return res.redirect('/');
    }
    await member.save({
        [`${req.query.role}_activation_sent_at`]: null,
        [`${req.query.role}_activation_hash`]: null,
        [`is${capitalize(req.query.role)}`]: 0
    }, {patch: true});

    if( !member.get('isAdmin') &&
        !member.get('admin_activation_hash') &&
        !member.get('isModerator') &&
        !member.get('moderator_activation_hash') &&
        !member.get('isMember') &&
        !member.get('member_activation_hash')
    )
        await member.destroy();

    sendTocRoleDeclineEmail(
        invitor.get('email'),
        req.get('host'),
        req.query.role,
        toc.get('name'),
        req.session.user.full_name,
        invitor.get('full_name')
    );

    req.flash('success', req.__('flashes.tocs.successfully-declined-role', req.query.role, toc.get('name'), invitor.get('full_name')));
    return res.redirect('/');
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const removeTocRole = async (req, res) => {
    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();

    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect('/404');
    }

    if(!req.query.role) {
        req.flash('error', __('flashes.roles.role-not-specified'));
        return res.redirect(`/tocs/${req.params.id}/members`);
    }

    const memberToc = await Toc.where({ uuid: req.params.id }).fetch();
    const member = await TocMember.where({
        stakeholder_id: stakeholder.get('id'),
        toc_id: memberToc.get("id")
    }).fetch();

    // Check if member does have this role
    const isRole = `is${capitalize(req.query.role)}`;
    const hasInvitationSentAt = `${req.query.role}_activation_sent_at`;
    const hasInvitationHash = `${req.query.role}_activation_hash`;
    if(!member.get(isRole)) {
        if(!hasInvitationSentAt) {
            req.flash('error', __('flashes.roles.remove.role-not-found'));
            return res.redirect(`/tocs/${req.params.id}/members`);
        }
    }

    // Make sure one admin remains
    if(req.query.role == 'admin') {
        const totalMembers = await TocMember.where({
            toc_id: memberToc.get("id")
        }).count('*');

        if(totalMembers <= 1) {
            req.flash('error', __('flashes.roles.remove.last-toc-admin'));
            return res.redirect(`/tocs/${req.params.id}/members`);
        }
    }

    await member.save({
        [isRole]: 0,
        [hasInvitationHash]: null,
        [hasInvitationSentAt]: null
    }, {patch: true});

    // Load the TOC
    const toc = await Toc.where({id: member.get('toc_id')}).fetch();

    // Remove permissions from Firebase.
    firebase.database().ref('/projects/' + toc.get('uuid') + '/people').child(stakeholder.get('id')).remove();

    // Notify stakeholder for his removal
    if(!(member.get('stakeholder_id') == req.session.user.id)) {
        const tocName = await Toc.query({where: {uuid: req.params.id}}).fetch({
            columns: ['name']
        });

        await sendTocRoleRemovalEmail(
            stakeholder.get('email'),
            req.get('host'),
            req.query.role,
            tocName.get('name'),
            req.session.user.full_name,
            stakeholder.get('full_name')
        );
    }

    if( !member.get('isAdmin') &&
        !member.get('admin_activation_hash') &&
        !member.get('isModerator') &&
        !member.get('moderator_activation_hash') &&
        !member.get('isMember') &&
        !member.get('member_activation_hash')
    )
        await member.destroy();

    req.flash('success', __('flashes.roles.successful-update'));
    return res.redirect(`/tocs/${req.params.id}/members`);
}

/**
 * Adds stakeholder to organisation and makes him admin
 * @param {Object} req
 * @param {Object} res
 * @returns {Function} Redirect
 */
const makeAdminOfOrganisation = async (req, res) => {
    //TODO: Need to be logged in first? Pro: Check if session user uses activation link
    if(!req.params.id || !req.query.token) {
        req.flash('error', __('flashes.wrong-parameters-token-link'));
        return res.redirect('/');
    }

    const member = await OrganisationMember.where({id: req.params.id}).fetch();
    if(!member) {
        req.flash('error', __('flashes.email-not-found'));
        return res.redirect('/');
    }

    // If stakeholder is already admin, return
    if(member.get('isAdmin')) {
        req.flash('error', __('flashes.roles.invitation.already-admin-organisation'));
        return res.redirect('/');
    }

    // If no activation hash exists in member row, return
    const admin_activation_hash = member.get('admin_activation_hash');
    if(!admin_activation_hash) {
        req.flash('error', __('flashes.roles.token.token-empty-in-db'));
        return res.redirect('/');
    }

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(),
        admin_activation_hash,
        member.get('admin_activation_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME);

    // If token is not legit, return
    if (!isLegit) {
        req.flash('error', __('flashes.roles.token.illegitimate-token'));
        return res.redirect('/');
    }

    await member.save({isAdmin: 1}, {patch: true});

    req.flash('success', __('flashes.roles.successful-update'));
    return res.redirect('/');
}

const declineAdminOfOrganisation = async (req, res) => {
    //TODO: Need to be logged in first? Pro: Check if session user uses activation link
    if(!req.params.id || !req.query.token || !req.query.invitor) {
        req.flash('error', __('flashes.wrong-parameters-token-link'));
        return res.redirect('/');
    }

    const member = await OrganisationMember.where({id: req.params.id}).fetch();
    if(!member) {
        req.flash('error', __('flashes.email-not-found'));
        return res.redirect('/');
    }

    const invitor = await Stakeholder.where({username: req.query.invitor}).fetch();

    // If no activation hash exists in member row, return
    const admin_activation_hash = member.get('admin_activation_hash');
    if(!admin_activation_hash) {
        req.flash('error', __('flashes.roles.token.token-empty-in-db'));
        return res.redirect('/');
    }

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(),
        admin_activation_hash,
        member.get('admin_activation_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    // If token is not legit, return
    if (!isLegit) {
        req.flash('error', __('flashes.roles.token.illegitimate-token'));
        return res.redirect('/');
    }
    const organisation_id = member.get('organisation_id');
    const org = await Organisation.where({id: organisation_id}).fetch();
    await member.destroy();

    sendOrganisationRoleDeclineEmail(
            invitor.get('email'),
            req.get('host'),
            'administrator',
            org.get('name'),
            req.session.user.username,
            invitor.get('full_name')
        );



    req.flash('success', __('flashes.roles.successful-update'));
    return res.redirect('/');
}

/**
 * Removes stakeholder from organisation if
 * he is not the last admin.
 * @param {Object} req
 * @param {Object} res
 * @returns {Function} Redirect
 */
const removeFromOrganisation = async (req, res) => {
    const stakeholder = await Stakeholder.where({username: req.params.username}).fetch();

    if(!stakeholder || !req.params.id) {
        req.flash('error', __('flashes.roles.remove.user-or-organisation-not-found'));
        return res.redirect('/404');
    }

    const organisation = await Organisation.where({
        slug: req.params.id
    }).fetch();
    const members = await OrganisationMember.where({
        organisation_id: organisation.get("id")
    }).fetchAll();

    // If this stakeholder is the last admin, return
    if(members.length <= 1) {
        req.flash('error', __('flashes.roles.remove.last-organisation-admin'));
        return res.redirect(`/stakeholders/${req.params.username}/organisations`);
    }

    // Remove stakeholder
    const member = members.toArray().filter(mem => mem.get('stakeholder_id') == stakeholder.get('id'));
    await member[0].destroy();

    await sendOrganisationRoleRemovalEmail(
        stakeholder.get('email'),
        req.get('host'),
        'administrator',
        organisation.get('name'),
        req.session.user.username,
        stakeholder.get('full_name')
    );

    req.flash('success', req.__('flashes.roles.remove.successfully-removed-as-orgadmin', stakeholder.get('full_name')));
    if(stakeholder.get('id') == req.session.user.id)
        return res.redirect(`/stakeholders/${req.params.username}/organisations`);
    return res.redirect(`/organisations/${req.params.id}`);
}

/**
 * Handles *initial* invite to Theory of Change
 * @param {*} req
 * @param {*} res
 */
const inviteTocRole = async (req, res) => {
    let redirect, stakeholder, toc;

    if(req.params.username) {
        stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
        toc = await Toc.where({id: req.body.toc_id}).fetch();
        redirect = `/stakeholders/${req.params.username}`;
    } else if (req.body.email && req.params.id) {
        stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
        toc = await Toc.query({where: {uuid: req.params.id}}).fetch();
        redirect = `/tocs/${req.params.id}/members`;
    } else {
        req.flash('error', __('flashes.unknown-problem'));
        return res.redirect('/404');
    }

    if(!toc) {
        req.flash('error', __('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect(redirect);
    }

    const membersInstances = await toc.getMembers(toc.get('id'));
    const members = membersInstances.toJSON();

    const existingMember = members.find(member => member.stakeholder_id == stakeholder.id);

    let roles;
    switch(req.body.role) {
        case 'member':
            if(existingMember && existingMember.isMember) {
                req.flash('error', __('flashes.roles.invitation.already-member-toc'));
                return res.redirect(redirect);
            }

            roles = members.filter(member => member.isMember);
            if(roles.length >= process.env.MAX_TOC_MEMBERS) {
                req.flash('error', req.__('flashes.roles.invitation.maximum-toc-members-reached', process.env.MAX_TOC_MEMBERS));
                return res.redirect(redirect);
            }
        break;

        case 'moderator':
            if(existingMember && existingMember.isModerator) {
                req.flash('error', __('flashes.roles.invitation.already-moderator-toc'));
                return res.redirect(redirect);
            }

            roles = members.filter(member => member.isModerator);
            if(roles.length >= process.env.MAX_TOC_MODERATORS) {
                req.flash('error', req.__('flashes.roles.invitation.maximum-toc-moderators-reached', process.env.MAX_TOC_MODERATORS));
                return res.redirect(redirect);
            }
        break;

        case 'admin':
            if(existingMember && existingMember.isAdmin) {
                req.flash('error', __('flashes.roles.invitation.already-admin-toc'));
                return res.redirect(redirect);
            }

            roles = members.filter(member => member.isAdmin);
            if(roles.length >= process.env.MAX_TOC_ADMINS) {
                req.flash('error', req.__('flashes.roles.invitation.maximum-toc-admins-reached', process.env.MAX_TOC_ADMINS));
                return res.redirect(redirect);
            }
        break;

        default:
            //TODO: Int
            req.flash('error', 'Unknown role');
            return res.redirect(redirect);
    }

    await inviteStakeholderAsTocRole(
        stakeholder,
        toc,
        req.get('host'),
        req.body.role,
        existingMember,
        req.session.user.username
    );

    req.flash('success', req.__('flashes.roles.invitation.succesfully-invited-toc-role', stakeholder.get('full_name'), req.body.role, toc.get('name')));
    return res.redirect(redirect);
}


/**
 * Handles *initial* invite to Theory of Change
 * @param {*} req
 * @param {*} res
 */
const reinviteTocRole = async (req, res) => {
    let redirect, stakeholder, toc;

    if(req.params.username) {
        stakeholder = await Stakeholder.where({username: req.params.username}).fetch();
        toc = await Toc.where({uuid: req.params.id}).fetch();
        redirect = `/tocs/${toc.get("uuid")}/members`;
    } else {
        req.flash('error', __('flashes.unknown-problem'));
        return res.redirect('/404');
    }

    if(!toc) {
        req.flash('error', __('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    if(!stakeholder) {
        req.flash('error', __('flashes.stakeholders.not-found'));
        return res.redirect(redirect);
    }

    const membersInstances = await toc.getMembers(toc.get('id'));
    const members = membersInstances.toJSON();

    const existingMember = members.find(member => member.stakeholder_id == stakeholder.id);
    const myself = await TocMember.where({stakeholder_id: stakeholder.get("id"), toc_id: toc.get("id")}).fetch();
    let role = myself.get("admin_activation_hash") ? "admin" : null;
    role = (role == null) ? (myself.get("member_activation_hash") ? "member" : null) : role;
    role = (role == null) ? (myself.get("moderator_activation_hash") ? "moderator" : null) : role;

    switch(role) {
        case 'member':
            if(existingMember && existingMember.isMember) {
                req.flash('error', __('flashes.roles.invitation.already-member-toc'));
                return res.redirect(redirect);
            }

            roles = members.filter(member => member.isMember);
            if(roles.length >= process.env.MAX_TOC_MEMBERS) {
                req.flash('error', req.__('flashes.roles.invitation.maximum-toc-members-reached', process.env.MAX_TOC_MEMBERS));
                return res.redirect(redirect);
            }
        break;

        case 'moderator':
            if(existingMember && existingMember.isModerator) {
                req.flash('error', __('flashes.roles.invitation.already-moderator-toc'));
                return res.redirect(redirect);
            }

            roles = members.filter(member => member.isModerator);
            if(roles.length >= process.env.MAX_TOC_MODERATORS) {
                req.flash('error', req.__('flashes.roles.invitation.maximum-toc-moderators-reached', process.env.MAX_TOC_MODERATORS));
                return res.redirect(redirect);
            }
        break;

        case 'admin':
            if(existingMember && existingMember.isAdmin) {
                req.flash('error', __('flashes.roles.invitation.already-admin-toc'));
                return res.redirect(redirect);
            }

            roles = members.filter(member => member.isAdmin);
            if(roles.length >= process.env.MAX_TOC_ADMINS) {
                req.flash('error', req.__('flashes.roles.invitation.maximum-toc-admins-reached', process.env.MAX_TOC_ADMINS));
                return res.redirect(redirect);
            }
        break;
    }

    await reinviteStakeholderAsTocRole(
        stakeholder,
        toc,
        req.get('host'),
        role,
        existingMember,
        req.session.user.username
    );

    req.flash('success', req.__('flashes.roles.invitation.succesfully-invited-toc-role', stakeholder.get('full_name'), role, toc.get('name')));
    return res.redirect(redirect);
}

module.exports = {
    index,
    show,
    showEdit,
    showOrganisations,
    showTocs,
    addTocRole,
    declineTocRole,
    removeTocRole,
    inviteTocRole,
    reinviteTocRole,
    inviteAsAdminToOrganisation,
    reinviteAsAdminToOrganisation,
    makeAdminOfOrganisation,
    declineAdminOfOrganisation,
    removeFromOrganisation,
    edit,
    deactivate,
    destroy
}
