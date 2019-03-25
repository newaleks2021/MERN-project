const Plan = require('../models/plan');
const Organisation = require('../models/organisation');
const OrganisationMember = require('../models/organisationMember');
const {countriesList} = require('../helpers/countriesList');

const sendContactEmail = require('../mailers/sendContactEmail');
const sendSupportEmail = require('../mailers/sendSupportEmail');
const validate = require('validate.js');
const sanitize = require('../helpers/sanitize');


// Render homepage
const showHome = async (req, res) => {
    console.log(req.url);
    res.render('web/home', {
       title: 'Home',
       careers: 1
    });
};


// Render the pricing page
const showPlans = async (req, res) => {
    const plans = await Plan.fetchAll();
    let organisation = null;
    let organisationPlan = null;
    let organisationTocs = null;
    let showUpgrade = true;

    const rankings = {
        "Free trial": 1,
        "Startup quarterly": 2,
        "Startup yearly": 2,
        "Medium quarterly": 3,
        "Medium yearly": 3,
        "Large": 4,
        "XL": 5
    };

    let currentRanking = 0;
    
    if(req.session.user && req.params.id) {
        organisation = await Organisation.where({
            slug: req.params.id
        }).fetch();

        if(organisation) {
            const plan = await Plan.where({
                id: organisation.get('plan_id')
            }).fetch();
        
            organisationPlan = plan.toJSON();

            if(organisationPlan)
            {
                currentRanking = rankings[organisationPlan.name];

                const date1 = organisation.get("subs_exp_date");
                const date2 = new Date();
                date2.setHours(0, 0, 0, 0);
                var timeDiff = date1.getTime() - date2.getTime();
                var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
                
                if(remainingDays > process.env.REMIND_UPGRADE_PLAN_DURATION)
                {
                    showUpgrade = false;
                }
            }
        }
        else
        {
            req.flash('error', __('flashes.organisations.not-found'));
            return res.redirect('/404');
        }
    }

    let amountOfActiveTocs = 0;
    if(organisation) {
        if(organisationPlan.price == 0.00) {
            req.flash('info', req.__('flashes.organisations.using-free-trial'));
        }

        const organisation_member = await OrganisationMember.where({
            organisation_id: organisation.get("id"),
            stakeholder_id: req.session.user.id,
            isAdmin: 1
        }).fetch();

        if(!organisation_member && !req.session.user.isAdmin)
        {
            req.flash('error', __('flashes.roles.middleware.not-administrator-of-organisation'));
            return res.redirect('/plans');
        }

        organisationTocs = await organisation.getTocs(organisation.get('id'));
        amountOfActiveTocs = organisationTocs.filter(function(toc){ return toc.get("isActivated") === 1 }).length;
    }

    const modalErrors = req.session.newPremiumOrganisationModalErrors;
    req.session.newPremiumOrganisationModalErrors = null;

    let modalErrorsObject = {};
    if(modalErrors)
    {
        modalErrorsObject[req.session.newPremiumOrganisationModalOpen] = modalErrors;
    }

    req.session.newPremiumOrganisationModalOpen = null;

    res.render('web/plans', {
        title: 'Plans',
        countriesList,
        plans: plans.toJSON(),
        organisationPlan: organisationPlan,
        rankings,
        currentRanking,
        showUpgrade,
        organisation: organisation ? organisation.toJSON() : organisation,
        newPremiumOrganisationModalErrors: modalErrorsObject,
        tocs: organisationTocs,
        amountOfActiveTocs
    });
};

// Render partnerships page
const showPartnerships = (req, res) => {
    return res.render('web/partnerships', {
        title: 'Partnerships'
    });
};

// Render careers page (contains info if we have a job opening, which is the case if WE_ARE_HIRING=1)
const showCareers = (req, res) => {
    return res.render('web/careers', {
        title: 'Careers'
    });
};

// Render terms page
const showTerms = (req, res) => {
    return res.render('web/terms', {
        title: 'Terms'
    });
};

// Render privacy page
const showPrivacy = (req, res) => {
    return res.render('web/privacy', {
        title: 'Privacy'
    });
};

// Render support organisations page
const support = async (req, res) => {
    req.body = sanitize(req.body);
    if(!req.body.name || !req.body.email || !req.body.message) {
        req.flash('error', __('flashes.missing-fields'));
        return res.redirect('/contact');
    }
    const constraints = {
        email: {
            email: true
        }
    };

    if (validate(req.body, constraints)) {
        req.flash('error', __('flashes.invalid-email'));
        return res.redirect('/contact?name='+req.body.name+'&email='+req.body.email+'&message='+req.body.message);
    }

    await sendSupportEmail(req.body);

    req.flash('success', __('flashes.support-success'));
    return res.redirect('/support-form');
};

// Render contact form page
const showContact = (req, res) => {
    return res.render('web/contact', {
        title: 'Contact',
        name: req.query.name,
        email: req.query.email,
        message: req.query.message,
        flashes: []
    });
};

// Render support form page
const showSupportForm = (req, res) => {
    return res.render('web/supportForm', {
        title: 'Support',
        name: req.query.name,
        email: req.query.email,
        message: req.query.message,
        flashes: []
    });
};

// Processes submit of form on contact page and support-form page
const contact = async (req, res) => {
    req.body = sanitize(req.body);
    if(!req.body.name || !req.body.email || !req.body.message) {
        req.flash('error', __('flashes.missing-fields'));
        return res.redirect('/contact');
    }
    const constraints = {
        email: {
            email: true
        }
    };

    if (validate(req.body, constraints)) {
        req.flash('error', __('flashes.invalid-email'));
        return res.redirect('/contact?name='+req.body.name+'&email='+req.body.email+'&message='+req.body.message);
    }

    await sendContactEmail(req.body);

    req.flash('success', __('flashes.contact-success'));
    return res.redirect('/contact');
};

module.exports = {
    showHome,
    showPlans,
    showPartnerships,
    showCareers,
    showTerms,
    showPrivacy,
    showContact,
    showSupportForm,
    contact,
    support
};
