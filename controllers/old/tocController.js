const bookshelf = require('../db');
const fs = require('fs');
const path = require('path');
const Toc = require('../models/toc');
const Plan = require('../models/plan');
const TocMember = require('../models/tocMember');
const Organisation = require('../models/organisation');
const OrganisationMember = require('../models/organisationMember');
const Stakeholder = require('../models/stakeholder');
const validate = require('validate.js');
const mailController = require('./mailController');

const getUpdatedFields = require('../helpers/getUpdatedFields');
const uuid = require('uuid/v4');
const firebase = require('./firebaseController');
const { newDateNow } = require('../helpers/dateHelper');
const { inviteStakeholderToMoveToC } = require('../services/invitationService');
const { isTokenLegitAndNotExpired } = require('../services/tokenService');
const sanitize = require('../helpers/sanitize');

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
        Toc.searchables.map((searchable, i) => {
            if(i == 0)
            {
                search += `tocs.${searchable} LIKE ?`
            }
            else
            {
                search += ` OR tocs.${searchable} LIKE ?`
            }

            bindings.push(`%${req.query.search}%`);
        });
    }

    if(search !== "")
    {
        raw += "(" + search + ")";
    }

    if(req.session.user && !req.session.user.isAdmin)
    {
        if(raw !== "")
        {
            raw += " AND ("
        }

        raw += "(tocs.shouldBeDestroyed = 0 AND tocs.id IN (SELECT toc_id FROM toc_members WHERE toc_members.stakeholder_id = ? AND (toc_members.isAdmin = 1 OR toc_members.isMember = 1))) OR (tocs.isActivated = 1 AND tocs.visibility = 1)";

        if(search !== "")
        {
            raw += ")";
        }

        bindings.push(req.session.user.id);
    }
    else if(!req.session.user)
    {
        if(raw !== "")
        {
            raw += " AND "
        }

        raw += "(tocs.isActivated = 1 AND tocs.visibility = 1)";
    }

    let tocsCount = await bookshelf.knex("tocs").innerJoin("organisations", function()
    {
        this.on("organisations.id", "=", "tocs.organisation_id");

        if((req.session.user && !req.session.user.isAdmin) || !req.session.user)
        {
            let date = new Date();
            let today = date.toISOString().split("T")[0];

            this.andOn("organisations.subs_exp_date", ">=", bookshelf.knex.raw("?", [today]));
        }
    }).whereRaw(raw, bindings).count("tocs.id as count");
    let tocsQuery = bookshelf.knex.select("tocs.*", "organisations.name AS organisation_name").from("tocs").innerJoin("organisations", function()
    {
        this.on("organisations.id", "=", "tocs.organisation_id");

        if((req.session.user && !req.session.user.isAdmin) || !req.session.user)
        {
            let date = new Date();
            let today = date.toISOString().split("T")[0];

            this.andOn("organisations.subs_exp_date", ">=", bookshelf.knex.raw("?", [today]));
        }
    });

    if(raw !== "")
    {
        tocsQuery.whereRaw(raw, bindings);
    }

    if(req.query.sortBy)
    {
        tocsQuery.orderBy(req.query.sortBy, (req.query.sortOrder ? req.query.sortOrder : "ASC"));
    }

    tocsQuery.limit(pagination.pageSize).offset(pagination.pageSize * (pagination.page - 1));

    const tocs = await tocsQuery;

    pagination.rowCount = tocsCount[0].count;
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

    res.render('tocs/index', {
        title: __('views.page-titles.tocs-index'),
        tocs,
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
 * @param {*} req
 * @param {*} res
 */
const show = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.tocs.not-found'))
        return res.redirect('/404');
    }

    let toc = await Toc.query({ where: { uuid: req.params.id} }).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'))
        return res.redirect('/404');
    }

    const organisation = await Organisation.where({ id: toc.get("organisation_id") }).fetch();
    const members = await toc.getMembersAsStakeholders(toc.get('id'), Stakeholder);
    const sessionMember = await TocMember.where({
        toc_id: toc.get('id'),
        stakeholder_id: req.session.user.id
    }).fetch();

    const flashes = Object.assign(req.session.flash, res.locals.flashes);
    let hasRoleInOrganisation = req.session.user.isAdmin ? true : false;

    for(var member of members)
    {
        if(member.id === req.session.user.id)
        {
            hasRoleInOrganisation = true;
            break;
        }
    }

    return res.render('tocs/profile', {
        title: `Theory of Change ${toc.get('name')}`,
        toc: toc.toJSON(),
        members,
        hasRoleInOrganisation,
        organisation,
        sessionMember: sessionMember ? sessionMember.toJSON() : sessionMember,
        flashes
    });
}

const showEmbed = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.tocs.not-found'))
        return res.redirect('/404');
    }

    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    return res.render('tocs/embed', {
        title: `Embed ToC ${toc.get('name')}`,
        toc: toc.toJSON()
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const showMembers = async (req, res) => {
    if(!req.params.id) {
        req.flash('error', req.__('flashes.tocs.not-found'))
        return res.redirect('/404');
    }

    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'))
        return res.redirect('/404');
    }

    const membersAsStakeholders = await toc.getMembersAsStakeholders(toc.get('id'), Stakeholder);

    // Because we need the stakeholder information of the members,
    // we also need their roles..
    await Promise.all(membersAsStakeholders.map(async stakeholder => {
        const tocMember = await TocMember.where({
            stakeholder_id: stakeholder.id,
            toc_id: toc.get('id')}
        ).fetch();

        stakeholder.isTocAdmin = tocMember.get('isAdmin');
        stakeholder.adminActivationSentAt = tocMember.get('admin_activation_sent_at');
        stakeholder.isModerator = tocMember.get('isModerator');
        stakeholder.moderatorActivationSentAt = tocMember.get('moderator_activation_sent_at');
        stakeholder.isMember = tocMember.get('isMember');
        stakeholder.memberActivationSentAt = tocMember.get('member_activation_sent_at');
        stakeholder.memberAt = tocMember.get('created_at');
    }));

    let sessionMember = await TocMember.where({
        stakeholder_id: req.session.user.id,
        toc_id: toc.get('id')
    }).fetch();

    if(sessionMember) {
        sessionMember = sessionMember.toJSON()
    }

    res.render('tocs/members', {
        title: `Theory of Change ${toc.get('name')} members`,
        toc: toc.toJSON(),
        members: membersAsStakeholders,
        sessionMember: sessionMember
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const create = async (req, res) => {
    if(!req.body.username) {
        req.flash('error', req.__('flashes.unknown-problem'))
        return res.redirect('/')
    }

    const stakeholder = await Stakeholder.where({username: req.body.username}).fetch();

    if(!stakeholder) {
        req.flash('error', req.__('flashes.stakeholders.not-found'))
        return res.redirect(`/stakeholders/${req.body.username}/organisations`);
    }

    const organisationMember = await OrganisationMember.where({isAdmin: 1, stakeholder_id: stakeholder.get("id"), organisation_id: req.body.organisation_id}).fetch();
    if(!organisationMember && !req.session.user.isAdmin)
    {
        req.flash('error', req.__('flashes.organisations.administrators-only'))
        return res.redirect(`/stakeholders/${req.body.username}/tocs`);
    }

    if(!stakeholder) {
        req.flash('error', req.__('flashes.stakeholders.not-found'))
        return res.redirect(`/stakeholders/${req.body.username}/organisations`);
    }

    if(!req.body.name || !req.body.organisation_id) {
        req.flash('error', req.__('flashes.tocs.missing-toc-or-organisation'));
        return res.redirect(`/stakeholders/${req.body.username}/organisations`);
    }

    const organisation = await Organisation.where({id: req.body.organisation_id}).fetch();
    const plan = await Plan.where({id: organisation.get('plan_id')}).fetch();
    const currentTocCount = await Toc.where({organisation_id: organisation.get("id"), isActivated: 1}).count('*');

    if(currentTocCount >= plan.get('max_tocs') && !req.session.user.isAdmin)
    {
        req.flash('error', req.__('flashes.plans.maximum-tocs-reached', organisation.get('slug')));
        return res.redirect(`/stakeholders/${req.session.user.username}/organisations`);
    }

    let errors = await Toc.ensureValidName(req.body.name);
    if(errors) {
        //TODO: (int): Moet met volgende regel nog iets gebeuren in kader van internationalisation?
        req.flash('error', errors);
        return res.redirect(`/stakeholders/${req.body.username}/organisations`)
    }
    const tocUUID = uuid();
    toc = await Toc.forge({
        uuid: tocUUID,
        name: req.body.name,
        organisation_id: req.body.organisation_id,
        isActivated: 1,
        visibility: 1,
        shouldBeDestroyed: 0
    }).save();

    if((currentTocCount + 1) === plan.get("max_tocs") && currentTocCount > 0)
    {
        const nextPlan = (await Plan.where("max_tocs", ">", plan.get("max_tocs")).orderBy('max_tocs', 'ASC').fetch());
        const host = req.get('host');
        await mailController.sendEmail(mailController.emails.hitPlanLimit, stakeholder.get("email"), {
            stakeholder: stakeholder.toJSON(),
            organisation: organisation.toJSON(),
            plan: plan.toJSON(),
            nextPlan: (nextPlan) ? nextPlan.toJSON() : null,
            buttonUrl: `${process.env.PROTOCOL}${host}/plans/${organisation.get("slug")}`,
            buttonText: "UPGRADE NOW",
            host: host,
            force: true // For testing purposes
        });
    }

    await TocMember.forge({
        stakeholder_id: stakeholder.get('id'),
        toc_id: toc.get('id'),
        isAdmin: 1,
        isMember: 1,
        isModerator: 1
    }).save();

    await toc.syncToFirebase();

    req.flash('success', req.__('flashes.tocs.successfully-created', req.body.name));
    return res.redirect(`/tocs/${toc.get('uuid')}/edit`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const showEdit = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();
    const members = await toc.getMembersAsStakeholders(toc.get('id'), Stakeholder);

    const sessionMember = await TocMember.where({
        stakeholder_id: req.session.user.id,
        toc_id: toc.get('id')
    }).fetch();

    res.render('tocs/edit', {
        title: `Edit ToC ${toc.get('name')}`,
        toc: toc.toJSON(),
        members,
        sessionMember: sessionMember ? sessionMember.toJSON() : sessionMember,
        oldInput: req.session.editTocFormInput || {}
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const edit = async (req, res) => {
    req.body = sanitize(req.body);
    req.session['editTocFormInput'] = req.body;
    if(req.session.user.isAdmin) {
        if(!req.body.isActivated) req.body.isActivated = 0;
        if(!req.body.shouldBeDestroyed) req.body.shouldBeDestroyed = 0;
    }

    const errors = validate(req.body, Toc.updateConstraints);
    if (errors) {
        req.flash('error', errors);
        return res.redirect(`/tocs/${req.params.id}/edit`);
    };

    const tocInstance = await Toc.query({where: {uuid: req.params.id}}).fetch();
    if(!tocInstance) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/');
    }

    const toc = tocInstance.toJSON();

    if(req.body.delete_avatar) {
        req.body.avatar = "";
        await fs.unlink(
            path.join(__dirname, `../public/uploads/${toc.avatar}`),
            () => {}
        );
    }

    const updatedFields = getUpdatedFields(req.body, toc);

    if(updatedFields.name) {
        const flash = await Toc.ensureValidName(updatedFields.name);
        if(flash) {
            // TODO: (int): Moet er met onderstaande regel nog iets gebeuren in kader van internationalisation?
            req.flash('error', flash);
            return res.redirect(`/tocs/${req.params.id}/edit`);
        }
    }

    if(req.session.user.isAdmin && updatedFields.isActivated) {
        firebase.database().ref(`/projects/${toc.uuid}`).update({is_activated: updatedFields.isActivated});
    }

    await tocInstance.save(updatedFields, {patch: true});
    await tocInstance.syncToFirebase();

    req.flash('success', req.__('flashes.tocs.successful-update') );
    req.session['editTocFormInput'] = null;
    return res.redirect(`/tocs/${toc.uuid}`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const moveToOrganisation = async (req, res) => {
    const toc = await Toc.query({where: {movement_username: req.session.user.username, uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(),
        toc.get("movement_hash"),
        toc.get('movement_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) {
        req.flash('error', __('flashes.roles.token.illegitimate-token'));
        return res.redirect('/');
    }

    let organisationsQuery = bookshelf.knex.select("organisations.*", "plans.name AS plan", "plans.max_tocs AS max_tocs", bookshelf.knex.raw("(SELECT COUNT (*) FROM tocs WHERE tocs.isActivated = 1 AND tocs.organisation_id = organisations.id) AS toc_amount")).from("organisations").innerJoin("plans", function()
    {
        this.on("plans.id", "=", "organisations.plan_id");
    }).where({slug: req.params.organisationSlug}).first();

    const organisation = await organisationsQuery;

    if(!organisation)
    {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/404');
    }

    /*  - activated
        - plan's expiration date shouldn't be expired
        - Nog niet aan maximum aantal ToCs zitten */

    const redirect = `/tocs/${toc.get("uuid")}/move-to-organisation/?token=${req.query.token}&invitor=${req.query.invitor}`;

    if(!organisation.isActivated)
    {
        req.flash('error', req.__('flashes.organisations.not-activated'));
        return res.redirect(redirect);
    }

    let today = new Date();
    var convertDateToString = function(date)
    {
        return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    }

    if(organisation.subs_exp_date < today && (convertDateToString(organisation.subs_exp_date) !== convertDateToString(today)))
    {
        req.flash('error', req.__('flashes.plans.plan-expired', organisation.slug));
        return res.redirect(redirect);
    }

    if(organisation.max_tocs <= organisation.toc_amount)
    {
        req.flash('error', req.__('flashes.plans.maximum-tocs-reached', organisation.slug));
        return res.redirect(redirect);
    }

    toc.moveToOrganisation(organisation);

    await toc.save({
        organisation_id: organisation.id,
        movement_hash: null,
        movement_sent_at: null,
        movement_username: null
    }, {patch: true});

    req.flash('success', req.__('flashes.tocs.succesfully-moved'));
    return res.redirect(`/organisations/${organisation.slug}`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const chooseMoveToOrganisation = async (req, res) => {
    const toc = await Toc.query({where: {movement_username: req.session.user.username, uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(),
        toc.get("movement_hash"),
        toc.get('movement_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) {
        req.flash('error', __('flashes.roles.token.illegitimate-token'));
        return res.redirect('/');
    }

    let raw = "organisations.id IN (SELECT organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = ? AND organisation_members.isAdmin = 1 AND deactivated_at IS NULL)";
    let bindings = [req.session.user.id];

    let organisationsCount = await bookshelf.knex("organisations").whereRaw(raw, bindings).count("id as count");
    let organisationsQuery = bookshelf.knex.select("organisations.*", "plans.name AS plan", "plans.max_tocs AS max_tocs", bookshelf.knex.raw("(SELECT COUNT (*) FROM tocs WHERE tocs.isActivated = 1 AND tocs.organisation_id = organisations.id) AS toc_amount")).from("organisations").innerJoin("plans", function()
    {
        this.on("plans.id", "=", "organisations.plan_id");
    }).whereRaw(raw, bindings);

    const organisations = await organisationsQuery;

    let today = new Date();
    var convertDateToString = function(date)
    {
        return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    }

    organisations.forEach(function(organisation)
    {
        if(!organisation.isActivated)
        {
            organisation.disabled = true;
            organisation.expired = false;
        }
        else if(organisation.subs_exp_date < today && (convertDateToString(organisation.subs_exp_date) !== convertDateToString(today)))
        {
            organisation.disabled = true;
            organisation.expired = true;
        }
        else if(organisation.max_tocs <= organisation.toc_amount)
        {
            organisation.disabled = true;
            organisation.expired = false;
        }
        else if(organisation.plan_id === 1)
        {
            organisation.disabled = true;
            organisation.expired = false;
        }
        else
        {
            organisation.disabled = false;
            organisation.expired = false;
        }
    });

    return res.render('tocs/choose-move-organisation', {
        toc: toc,
        query: req.query,
        title: `Move ToC ${toc.get("name")} to your organisation`,
        organisations
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const copy = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();
    const organisation = await Organisation.query({ where: { id: toc.get("organisation_id") }}).fetch();
    const plan = await Plan.query({ where: { id: organisation.get("plan_id") }}).fetch();
    const activeTocs =  await Toc.where({organisation_id: organisation.get("id"), isActivated: 1}).count('*');

    if(activeTocs >= plan.get('max_tocs'))
    {
        req.flash('error', req.__('flashes.plans.maximum-tocs-reached', organisation.get('slug')));
        return res.redirect(`/tocs/${req.params.id}`);
    }

    const date1 = organisation.get("subs_exp_date");
    const date2 = new Date();
    date2.setHours(0, 0, 0, 0);
    var timeDiff = date1.getTime() - date2.getTime();
    var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if(remainingDays < 0)
    {
        req.flash('error', req.__('flashes.plans.plan-expired', organisation.get("slug")));
        return res.redirect(`/tocs/${req.params.id}`);
    }

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    const keepPermissions = (req.body && req.body.keep_permissions && req.body.keep_permissions === "on");
    const newUuid = await toc.copy(keepPermissions, req.session.user.id);

    if(newUuid)
    {
        const newId = await Toc.forge({
          uuid: newUuid,
          name: toc.get("name") + " (copy)",
          organisation_id: toc.get("organisation_id"),
          isActivated: toc.get("isActivated"),
          visibility: toc.get("visibility"),
          shouldBeDestroyed: toc.get("shouldBeDestroyed")
        }).save().get("id");

        if(keepPermissions)
        {
            const tocMembers = await toc.getMembers(toc.get("id"));

            await Promise.all(tocMembers.map(function(tocMember)
            {
                return TocMember.forge({
                    stakeholder_id: tocMember.get('stakeholder_id'),
                    toc_id: newId,
                    isAdmin: tocMember.get('isAdmin'),
                    isMember: tocMember.get('isMember'),
                    isModerator: tocMember.get('isModerator')
                }).save();
            }));
        }
        else
        {
            await TocMember.forge({
                stakeholder_id: req.session.user.id,
                toc_id: newId,
                isAdmin: 1,
                isMember: 1,
                isModerator: 1
            }).save();
        }

        req.flash('success', req.__('flashes.tocs.succesfully-copied'));
        return res.redirect(`/tocs/${newUuid}`);
    }
    else
    {
      req.flash('error', req.__('flashes.tocs.failed-copied'));
      return res.redirect(`/tocs/${req.params.id}`);
    }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const initMove = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'));
        return res.redirect('/404');
    }

    const stakeholder = await Stakeholder.where({email: req.body.email}).fetch();

    if(!stakeholder)
    {
        req.flash('error', req.__('flashes.stakeholders.not-found'));
        return res.redirect(`/tocs/${req.params.id}`);
    }

    await inviteStakeholderToMoveToC(
        stakeholder,
        toc,
        req.get('host'),
        req.session.user.username
    );

    req.flash('success', req.__('flashes.tocs.succesfully-invited-toc-move', stakeholder.get('full_name')));
    return res.redirect(`/tocs/${req.params.id}`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const deactivate = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    if(!toc) {
        req.flash('error', req.__('flashes.tocs.not-found'))
        return res.redirect('/404');
    }

    await toc.deactivate(toc);

    req.flash('success', req.__('flashes.tocs.deactivate-toc'));
    return res.redirect(`/stakeholders/${req.session.user.username}/tocs`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const destroy = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();

    const members = await toc.getMembers(toc.get('id'));
    await Promise.all(members.forEach(async member => {
        await member.destroy();
    }));
    await toc.deleteFromFirebase();
    await toc.destroy();
    req.flash('success', __('flashes.tocs.successful-destroy'));
    return res.redirect(`/tocs`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const switchActiveState = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();
    const organisation = await Organisation.query({where: {id: toc.get("organisation_id")}}).fetch();
    const affiliateProgramPlan = await Plan.query({where: {name: process.env.AFFILIATE_PROGRAM_PLAN_NAME }}).fetch();

    if(organisation.get("plan_id") === affiliateProgramPlan.get("id"))
    {
        req.flash(
            'error',
            req.__('flashes.tocs.disallowed-state-switch')
        );
        return res.redirect(`/stakeholders/${req.session.user.username}/tocs`);
    }

    const newState = toc.get('isActivated') ? 1 : 0;

    await toc.save({isActivated: newState}, {patch: true});
    firebase.database().ref(`/projects/${toc.get('uuid')}`).update({is_activated: newState});

    req.flash(
        'success',
        req.__('flashes.tocs.state-switch',
            toc.get('name'),
            `${toc.get('isActivated') ? '' : req.__('flashes.tocs.state-switch2')}`
        )
    );

    return res.redirect(`/stakeholders/${req.session.user.username}/tocs`);
}

const affiliateProgramUpdate = async () => {
    return new Promise(async function(resolve, reject)
    {
        const TocModel = require('../models/toc');
        const affiliateProgramPlan = await Plan.query({where: {name: process.env.AFFILIATE_PROGRAM_PLAN_NAME }}).fetch();

        var date = new Date();
        date.setMonth(date.getMonth() - 3);

        let threeMonthsAgo = date.toISOString().split("T")[0];

        if(affiliateProgramPlan)
        {
            const bindings = [threeMonthsAgo];

            let tocIds = await bookshelf.knex.select("tocs.id").from("tocs").innerJoin("organisations", function()
            {
                this.on("organisations.id", "=", "tocs.organisation_id");
                this.andOn("organisations.plan_id", "=", affiliateProgramPlan.get("id"));
            }).whereRaw("tocs.isActivated = 1 AND tocs.created_at < ?", bindings);

            for(tocId of tocIds)
            {
                const toc = await TocModel.query({ where: { id: tocId.id } }).fetch();

                await toc.save({
                    isActivated: 0
                }, { patch: true });

                await toc.syncToFirebase();
            }

            resolve();
        }
    });
}

module.exports = {
    index,
    show,
    showEmbed,
    showMembers,
    create,
    showEdit,
    edit,
    copy,
    deactivate,
    destroy,
    switchActiveState,
    initMove,
    chooseMoveToOrganisation,
    moveToOrganisation,
    affiliateProgramUpdate
}
