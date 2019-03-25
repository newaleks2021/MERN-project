const SupportOrganisation = require('../models/supportOrganisation');
const getUpdatedFields = require('../helpers/getUpdatedFields');
const sanitize = require('../helpers/sanitize');

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Shows tale overview with all support organisations
*/
const index = async (req, res) => {
    const supportOrganisations = await SupportOrganisation.forge().orderBy("sort_order", "ASC").fetchAll();

    return res.render('support/index', {
        title: 'All support organisations',
        supportOrganisations: 
            supportOrganisations ? supportOrganisations.toJSON() : supportOrganisations 
    });
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Shows page with all support organisations
*/
const showSupport = async (req, res) => {
    const supportOrganisations = await SupportOrganisation.forge().orderBy("sort_order", "ASC").fetchAll();

    return res.render('web/support', {
        title: 'Support',
        supportOrganisations: 
            supportOrganisations ? supportOrganisations.toJSON() : supportOrganisations 
    });
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Renders form to create a new support organisation
*/
const showCreate = (req, res) => {
    res.render('support/create', {
        title: 'New support organisation',
        oldInput: req.session.createSupportOrgInput || {},
    });
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Creates a new support organisation
*/
const create = async (req, res) => {
    req.session['createSupportOrgInput'] = req.body;

    const errors = await SupportOrganisation.ensureValidName(req.body.name);

    if(errors) {
        req.flash('error', errors);
        return res.redirect('back');
    }

    const sort_order = await SupportOrganisation.getNextOrder();
    const {name, logo, description, link, specialisation_tags, countries} 
        = req.body;
    await SupportOrganisation.forge({
        name,
        logo,
        description,
        link,
        specialisation_tags,
        countries,
        sort_order
    }).save();

    req.session['createSupportOrgInput'] = null;
    req.flash('success', 'Succesfully created new support organisation!');
    return res.redirect('/support/all');
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Removes a support organisation
*/
const destroy = async (req, res) => {
    const supportOrg = await SupportOrganisation.where({id: req.params.id}).fetch();
    await supportOrg.destroy();

    req.flash('success', __('flashes.plans.successfully-destroyed'));
    return res.redirect('/support/all');
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Renders form to edit an existing support organisation
*/
const showEdit = async (req, res) => {
    req.session['editSupportOrgInput'] = req.body;
    const org = await SupportOrganisation.where({id: req.params.id}).fetch();
    return res.render('support/edit', {
        title: 'Edit support organisation',
        org: org.toJSON(),
        oldInput: req.session.editSupportOrgInput || {},
    });
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Saves changes to an existing support organisation
*/
const edit = async (req, res) => {
    req.body = sanitize(req.body);
    const organisationInstance = await SupportOrganisation.where({id: req.params.id}).fetch();
    if(!organisationInstance) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/');
    }

    const organisation = organisationInstance.toJSON();

    // Delete avatar if checked
    if (req.body.delete_logo) {
        req.body.logo = "";
        await fs.unlink(
            path.join(__dirname, `../public/uploads/${organisation.avatar}`), 
            () => {}
        );
    }

    const updatedFields = getUpdatedFields(req.body, organisation);

    if(updatedFields.name) {
        const flash = await SupportOrganisation.ensureValidName(updatedFields.name);
        if(flash) {
            req.flash('error', flash);
            return res.redirect('back');
        }
    }

    await organisationInstance.save(updatedFields, {patch: true});
    
    req.session['editSupportOrgInput'] = null;

    req.flash('success', req.__('flashes.organisations.successfully-updated', organisationInstance.get("name")));
    return res.redirect('/support/all');
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Changes the order of support organisations, which determines the order in which they are shown
*/
const moveUp = async (req, res) => {
    const organisation = await SupportOrganisation.where({id: req.params.id}).fetch();
    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/');
    }

    const upOrganisation = await SupportOrganisation.forge().where('sort_order', '<', organisation.get("sort_order")).orderBy("sort_order", "DESC").fetch();

    if(upOrganisation)
    {
        const upSort = upOrganisation.get("sort_order");
        const currentSort = organisation.get("sort_order");

        await organisation.save({ sort_order: upSort }, { patch: true });
        await upOrganisation.save({ sort_order: currentSort }, { patch: true });
    }

    return res.redirect('/support/all');
};

/**
*
* @param {Object} req 
* @param {Object} res 
* @returns {}
* Changes the order of support organisations, which determines the order in which they are shown
*/
const moveDown = async (req, res) => {
    const organisation = await SupportOrganisation.where({id: req.params.id}).fetch();
    if(!organisation) {
        req.flash('error', req.__('flashes.organisations.not-found'));
        return res.redirect('/');
    }

    const downOrganisation = await SupportOrganisation.forge().where('sort_order', '>', organisation.get("sort_order")).orderBy("sort_order", "ASC").fetch();

    if(downOrganisation)
    {
        const downSort = downOrganisation.get("sort_order");
        const currentSort = organisation.get("sort_order");

        await organisation.save({ sort_order: downSort }, { patch: true });
        await downOrganisation.save({ sort_order: currentSort }, { patch: true });
    }

    return res.redirect('/support/all');
};

module.exports = {
    index,
    showSupport,
    create,
    showCreate,
    destroy,
    showEdit,
    edit,
    moveDown,
    moveUp
};