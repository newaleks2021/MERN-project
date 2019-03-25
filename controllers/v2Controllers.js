require('dotenv').config({ path: 'variables.env' });
const {ACTIVATION_TOKEN_LIFETIME} = process.env;
const Plan = require('../models/plan');
const Post = require('../models/post');
const SentEmail = require('../models/sent_email');
const Toc = require('../models/toc');
const TocMember = require('../models/tocMember');
const Stakeholder = require('../models/stakeholder');
const Organisation = require('../models/organisation');
const OrganisationMember = require('../models/organisationMember');
const sanitize = require('../helpers/sanitize');
const getUpdatedFields = require('../helpers/getUpdatedFields');
const {encrypt} = require('../helpers/hashing');
const sendPasswordResetEmail = require('../mailers/sendPasswordResetEmail');
const bookshelf = require('../db');
const fs = require('fs');
const capitalize = require('lodash/capitalize');
const firebase = require('./firebaseController');
const path = require('path');
const validate = require('validate.js');
const {countriesList, getCountryByCode, isEUCountry} = require('../helpers/countriesList');
const {newDateNow, newDateYesterday} = require('../helpers/dateHelper');
const slug = require('slug');
const formatDate = require('date-fns/format');
const {getMonth, getYear} = require('date-fns');
const uuid = require('uuid');
const mime = require('mime');
const jimp = require('jimp');
const addDays = require('date-fns/add_days');
const mkdirp = require('mkdirp');
const sendAccountValidationEmail = require('../mailers/sendAccountValidationEmail');
const sendTocRoleRemovalEmail = require('../mailers/sendTocRoleRemovalEmail');
const sendOrganisationRoleRemovalEmail = require('../mailers/sendOrganisationRoleRemovalEmail');
const sendOrganisationRoleDeclineEmail = require('../mailers/sendOrganisationRoleDeclineEmail');
const sendTocRoleDeclineEmail = require('../mailers/sendTocRoleDeclineEmail');
const mailController = require('./mailController');
const Coupon = require('../models/coupon');
const Transaction = require('../models/transaction');
const sha1 = require('sha1');
const {
    generateActivationToken,
    isTokenLegitAndNotExpired,
    generatePasswordResetToken
} = require('../services/tokenService');
const {
    getAllLanguages,
    filterTopicsByLanguage,
    sortTopicsByFixedTopicsOrder,
    sortTopicsBySticky,
    sortTopicsByPublicationDate,
    filterTopicsByAcceptedForPublication,
    filterPostsByAcceptedForPublication,
    sortPostsByPublicationDate,
    filterByTocAcademyCategory
} = require('../services/tocAcademyContentService');
const {
    inviteStakeholderAsOrganisationAdmin,
    inviteStakeholderAsTocRole,
    reinviteStakeholderAsOrganisationAdmin,
    reinviteStakeholderAsTocRole,
    inviteStakeholderToMoveToC,
} = require('../services/invitationService');

const upload_image = async (base64) => {
    const buff = Buffer.from(base64.split(',').slice(1).join(','), 'base64');
    let avatar = await jimp.read(buff);
    await avatar.resize(parseInt(process.env.RESIZE_AVATAR_SIZE), jimp.AUTO);
    const extension = mime.extension(base64.split(/[:;]/)[1]);
    const name = `${uuid.v4()}.${extension}`;
    const date = new Date();
    const folder = `/uploads/${getYear(date)}/${getMonth(date)}`;
    const fullpath = path.resolve(`./client${folder}`);
    mkdirp.sync(fullpath);
    await avatar.write(`${fullpath}/${name}`);
    return `${folder}/${name}`;
};




/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
//////////////////////////// GROUP: PAYMENT /////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////
////////////////////////////// HELPERS //////////////////////////////////
/////////////////////////////////////////////////////////////////////////

/**
 *
 * @param {*} number
 * @param {*} amountOfDecimals
 * @param {*} decimalSeperator
 * @param {*} thousandsSeperator
 */
const formatMoney = function(n, c, d, t){
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d == undefined ? "," : d,
    t = t == undefined ? "." : t,
    s = n < 0 ? "-" : "",
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
    j = (j = i.length) > 3 ? j % 3 : 0;

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};


/**
 *
 * Calculates the correct VAT (value added tax) percentage to charge the user, depending on country of user and whether user has a validated VAT identification number
 * @param {*} organisation
 */
const getVatPercentage = (organisation) => {
    const code = getCountryByCode(organisation.country);

    if(code === "NL")
    {
        // If from NL, 21% no matter whether vatnr is validated or not
        return 0.21;
    }
    else if(organisation.isValidVatNumber)
    {
        // If not from NL and vatnr is valid
        return 0.00;
    }
    else
    {
        // VAT if not a validated vatnr, from the EU but not from NL
        if(["BE", "CZ", "ES", "LV", "LT"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.21;
        }

        if(["BG", "EE", "FR", "AT", "SK", "UK"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.20;
        }

        if(["DK", "HR", "SE", "DK"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.25;
        }

        if(["CY", "RO"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.19;
        }

        if(["IE", "PL", "PT"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.23;
        }

        if(["IT", "SI"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.22;
        }

        if(["EL", "FI"].indexOf(code) >= 0)
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.24;
        }

        if(code === "LU")
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.17;
        }

        if(code === "HU")
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.27;
        }

        if(code === "MT")
        {
            // Todo: Boven bepaald bedrag de lokale belasting percentages rekenen
            return 0.21;

            return 0.18;
        }

        return 0.00;
    }
};


/**
 *
 * @param {*} currency
 */
const getCurrencySymbol = (currency) => {
    const currencies = {
        "eur": "€",
        "usd": "$"
    };

    if(currency in currencies)
    {
        return currencies[currency];
    }

    return "";
};


/**
 *
 * Calculates a hash to send to the payment provider PayLane
 * @param {*} description
 * @param {*} amount
 * @param {*} currency
 * @param {*} transaction_type
 */
const generateRequestPaylaneHash = (description, amount, currency, transaction_type) => {
    const hash = sha1(process.env.PAYLANE_SALT + "|" + description + "|" + amount + "|" + currency + "|" + transaction_type);

    return hash;
};


/**
 *
 * Calculates a hash based on the response from payment provider PayLane
 * @param {*} description
 * @param {*} amount
 * @param {*} currency
 * @param {*} transaction_type
 */
const generateResponsePaylaneHash = (status, description, amount, currency, id) => {
    const hash = sha1(process.env.PAYLANE_SALT + "|" + status + "|" + description + "|" + amount + "|" + currency + "|" + id);

    return hash;
};


// Calculates the different variables for a payment, such as discount, vat, total amount, etc.
const getPaymentData = async (organisation, plan, coupon) => {
    const currencySymbol = getCurrencySymbol(plan.currency);
    const currencyCode = plan.currency.toUpperCase();

    // Calculate discount
    const date1 = organisation.subs_exp_date;
    const date2 = new Date();
    date2.setHours(0, 0, 0, 0);
    var timeDiff = date1.getTime() - date2.getTime();
    var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    let discount = 0;

    if(remainingDays > 0)
    {
        const currentPlan = await Plan.where({id: organisation.plan_id}).fetch();
        const raw = "plan_id = ? AND organisation_id = ? AND status = ?";
        const bindings = [organisation.plan_id, organisation.id, "PERFORMED"];
        const lastTransactionCurrentPlan = await bookshelf.knex.select("*").from("transactions").whereRaw(raw, bindings).orderBy("created_at", "DESC").first();

        if(lastTransactionCurrentPlan)
        {
            discount = (lastTransactionCurrentPlan.amount_ex_vat / parseFloat(currentPlan.get("period"))) * remainingDays;
        }
    }

    let couponAmount = 0;
    let couponPercentage = 1;
    if(coupon)
    {
        couponAmount = coupon.discount_amount;
        couponPercentage = 1.0 - (coupon.discount_percentage / 100.0);

        if(couponPercentage < 0.0)
        {
            couponPercentage = 0.0;
        }
    }

    let subtotal = plan.price - couponAmount - discount;
    let subtotalCouponPercentage = subtotal - (subtotal * couponPercentage);
    let totalCoupon = couponAmount + subtotalCouponPercentage;
    subtotal *= couponPercentage;

    if(subtotal < 0)
    {
        subtotal = 0;
    }

    const vatPercentage = getVatPercentage(organisation);
    const vat = Number((subtotal * vatPercentage).toFixed(2));
    const total = subtotal + vat;
    const countryCode = getCountryByCode(organisation.country);

    return {
        vatPercentage: (100 * vatPercentage),
        format: {
            plan: formatMoney(plan.price, 2, ",", "."),
            discount: formatMoney(discount, 2, ",", "."),
            coupon: formatMoney(totalCoupon, 2, ",", "."),
            subtotal: formatMoney(subtotal, 2, ",", "."),
            total: formatMoney(total, 2, ",", "."),
            vat: formatMoney(vat, 2, ",", ".")
        },
        raw: {
            plan: parseFloat(plan.price.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            totalCoupon: parseFloat(totalCoupon.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            vat: parseFloat(vat.toFixed(2))
        },
        countryCode,
        currencySymbol,
        currencyCode,
        remainingDays
    };
};


/////////////////////////////////////////////////////////////////////////
///////////////////// CHECKOUT AND PAYMENT PROCESS //////////////////////
/////////////////////////////////////////////////////////////////////////

// Check the validity of a discount coupon during checkout (upon pressing the coupon submit button)
const apply_payment_coupon = async (req, res) => {
    if(!req.body.coupon) return res.json({ error: 'invalid-coupon-code' });

    const coupon = await Coupon.where({code: req.body.coupon}).fetch();
    
    // Return if coupon code can not be found
    if(!coupon) return res.json({ error: 'invalid-coupon-code' });

    // Check max uses
    const transactionWithCouponCountQuery = await bookshelf.knex("transactions").whereRaw("coupon_id = ?", [coupon.get("id")]).count("id as count");
    const transactionWithCouponCount = transactionWithCouponCountQuery[0].count;

    if(coupon.get("max_use") > 0 && transactionWithCouponCount >= coupon.get("max_use")) return res.json({ error: 'coupon-code-max-used' });
    
    // Check expiration date
    const date1 = coupon.get("exp_date");

    if(date1)
    {
        const date2 = new Date();
        date2.setHours(0, 0, 0, 0);
        var timeDiff = date1.getTime() - date2.getTime();
        var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if(remainingDays < 0) return res.json({ error: 'coupon-code-expired' });
    }

    // Check if valid for plan
    const planId = coupon.get("plan_id");
    if(planId && planId.toString() !== String(req.body.id)) return res.json({ error: 'coupon-code-not-applicable' });

    // Check if valid-for has not expired
    const validFor = parseInt(coupon.get("valid_for"));
    const organisation = await Organisation.where({id:parseInt(req.body.organisation, 10)}).fetch();
    const createdAt = organisation.get("created_at");
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

    if(secondsSinceCreation > (validFor * 3600)) return res.json({ error: 'coupon-code-no-longer-valid' });

    return res.json({ success: true });
};


// Render the checkout overview after selecting the subscription plan or submitting a discount coupon, and before going to the payment processor PayLane
const checkout_payment = async (req, res) => {
    const planObject = await Plan.where({id: parseInt(req.body.plan, 10)}).fetch();
    const organisationObject = await Organisation.where({id: parseInt(req.body.organisation, 10)}).fetch();
    const stakeholderObject = await Stakeholder.where({id: req.session.user.id}).fetch();
    let couponObject = null;

    if(req.body.couponCode)
    {
        couponObject = await Coupon.where({code: req.body.couponCode}).fetch();
    }

    const organisation = organisationObject.toJSON();
    const stakeholder = stakeholderObject.toJSON();
    const plan = planObject.toJSON();
    const coupon = couponObject ? couponObject.toJSON() : null;
    const paymentData = await getPaymentData(organisation, plan, coupon);

    if(coupon)
    {
        // Check if valid for plan
        const planId = coupon.plan_id;
        if(planId && planId.toString() !== String(req.body.id)) return res.json({ error: 'coupon-code-not-applicable' });

        // Check if valid-for has not expired
        const validFor = parseInt(coupon.valid_for);
        const createdAt = organisation.created_at;
        const now = new Date();
        const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

        if(secondsSinceCreation > (validFor * 3600)) return res.json({ error: 'coupon-code-no-longer-valid' });
    }

    // Return if certain information that is required for the invoice is missing
    if(!organisation.country || !organisation.address || !paymentData.countryCode) return res.json({ error: 'missing-country-address' });

    // Return if the existing subscription does not expire any time soon
    if(organisation.plan_id === plan.id && paymentData.remainingDays > process.env.REMIND_UPGRADE_PLAN_DURATION) return res.json({ error: 'not-eligble-for-extension' });

    return res.json({
        merchant_id: process.env.PAYLANE_MERCHANT_ID,
        organisation: organisation,
        stakeholder: stakeholder,
        plan: plan,
        payment: paymentData,
        coupon: coupon,
        hash: generateRequestPaylaneHash(`plan-${plan.id}`, paymentData.raw.total, paymentData.currencyCode, "S")
    });
};


// Submit of checkout form to go to payment processor PayLane. Nee dat kan het niet zijn, want dat is niet een method hier maar is gewoon die form op checkout page
// TODO: When I look at the code, the two methods seem similar but the 2nd a bit better written (newer version?) but the last line of the second method has not been rewritten for React/JSON yet, while for the 1st method it has.
// TODO: Maar beide methods (completePayment) komen niet in huidige routes voor (die zo wie zo veel ontbreekt). In oude routes file staan beide methods (get vs post): https://gitlab.uncinc.nl/sites/changeroo-portal/blob/69064d224b3d254ccfa0b48708403bba4d35b493/routes/index.js
const complete_payment_changeroo = async (req, res) => {
    let couponObject = null;

    if(req.body.couponCode)
    {
        couponObject = await Coupon.where({code: req.body.couponCode}).fetch();
    }

    const coupon = couponObject ? couponObject.toJSON() : null;

    const requiredFields = ["amount", "currency", "description", "hash"];
    for(var i = 0; i < requiredFields.length; i++)
    {
        const requiredField = requiredFields[i];

        if(!(requiredField in req.body)) return res.json({ error: 'missing-fields' });
    }

    // Check integrity of payment
    const planId = parseInt(req.body.description.replace("plan-", ""));
    const planObject = await Plan.where({id: parseInt(req.body.id, 10)}).fetch();
    const organisationObject = await Organisation.where({id: parseInt(req.body.organisation, 10)}).fetch();
    const stakeholderObject = await Stakeholder.where({id: req.session.user.id}).fetch();

    const stakeholder = stakeholderObject.toJSON();
    const organisation = organisationObject.toJSON();
    const plan = planObject.toJSON();

    if(planId === plan.id)
    {
        const paymentData = await getPaymentData(organisation, plan, coupon);

        if(paymentData.raw.total <= 0)
        {
            const transactionId = await Transaction.forge({
                plan_id: plan.id,
                stakeholder_id: stakeholder.id,
                organisation_id: organisation.id,
                coupon_id: (coupon) ? coupon.id : null,
                paylane_id: 0,
                amount_ex_vat: 0,
                amount_inc_vat: 0,
                vat_percentage: paymentData.vatPercentage,
                status: "PERFORMED"
            }).save().get('id');

            // Period in days * 24 hours * 60 minutes * 60 seconds and convert to milliseconds
            let subs_exp_date = null;

            if(coupon && coupon.extension_days > 0)
            {
                subs_exp_date = new Date(Date.now() + ((plan.period + coupon.extension_days) * 24 * 60 * 60 * 1000));
            }
            else
            {
                subs_exp_date = new Date(Date.now() + (plan.period * 24 * 60 * 60 * 1000));
            }

            await organisationObject.save({
                plan_id: plan.id,
                subs_exp_date: subs_exp_date
            }, { patch: true });

            await mailController.sendEmail(mailController.emails.invoice, stakeholder.email, {
              stakeholder: stakeholder,
              organisation: organisation,
              buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisation/${organisation.id}`,
              buttonText: "OPEN INVOICE",
              host: req.get('host'),
              force: true, // For testing purposes
              templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });

            await mailController.sendEmail(mailController.emails.invoice, "info@changeroo.com", {
              stakeholder: stakeholder,
              organisation: organisation,
              buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisation/${organisation.id}`,
              buttonText: "OPEN INVOICE",
              host: req.get('host'),
              force: true, // For testing purposes  // TODO: Should this be removed...?
              templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });

            return res.json({ success: true });
        }
    }
};


// Process what is returned by payment provider PayLane
// TODO: What's the difference with the previous method?? Is the above one an old version perhaps?? Are they both being used?
// TODO: The method below is a get and the method above a post...
const complete_payment = async (req, res) => {
    let couponObject = null;

    if(req.body.couponCode)
    {
        couponObject = await Coupon.where({code: req.body.couponCode}).fetch();
    }

    const coupon = couponObject ? couponObject.toJSON() : null;

    if("id_error" in req.body) return res.json({ error: req.body.id_error });

    const requiredFields = ["status", "amount", "currency", "description", "hash", "id_sale"];
    for(var i = 0; i < requiredFields.length; i++)
    {
        const requiredField = requiredFields[i];

        if(!(requiredField in req.body)) return res.json({ error: 'missing-fields' });
    }

    // Check integrity of payment
    const hash = generateResponsePaylaneHash(req.body.status, req.body.description, req.body.amount, req.body.currency, req.body.id_sale);
    if(hash !== req.body.hash )return res.json({ error: 'invalid-hash' });

    const planId = parseInt(req.body.description.replace("plan-", ""));
    const planObject = await Plan.where({id: parseInt(req.body.plan, 10)}).fetch();
    const organisationObject = await Organisation.where({id: parseInt(req.body.organisation, 10) }).fetch();
    const stakeholderObject = await Stakeholder.where({id: req.session.user.id}).fetch();

    const stakeholder = stakeholderObject.toJSON();
    const organisation = organisationObject.toJSON();
    const plan = planObject.toJSON();

    if(planId !== plan.id) return res.json({ error: 'plan-mismatch' });

    const paymentData = await getPaymentData(organisation, plan, coupon);

    const amount_inc_vat = parseFloat(req.body.amount);
    const amount_ex_vat = amount_inc_vat / ((100 + paymentData.vatPercentage) / 100);

    const transactionId = await Transaction.forge({
        plan_id: plan.id,
        stakeholder_id: stakeholder.id,
        organisation_id: organisation.id,
        coupon_id: (coupon) ? coupon.id : null,
        paylane_id: req.body.id_sale,
        amount_ex_vat: amount_ex_vat,
        amount_inc_vat: amount_inc_vat,
        vat_percentage: paymentData.vatPercentage,
        status: req.body.status
    }).save().get('id');

    // Period in days * 24 hours * 60 minutes * 60 seconds and convert to milliseconds
    let subs_exp_date = null;

    if(coupon && coupon.extension_days > 0)
    {
        subs_exp_date = new Date(Date.now() + ((plan.period + coupon.extension_days) * 24 * 60 * 60 * 1000));
    }
    else
    {
        subs_exp_date = new Date(Date.now() + (plan.period * 24 * 60 * 60 * 1000));
    }

    await organisationObject.save({
        plan_id: plan.id,
        subs_exp_date: subs_exp_date
    }, { patch: true });

    await mailController.sendEmail(mailController.emails.invoice, stakeholder.email, {
        stakeholder: stakeholder,
        organisation: organisation,
        buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisation/${organisation.id}`,
        buttonText: "OPEN INVOICE",
        host: req.get('host'),
        force: true, // For testing purposes
        templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
    });

    await mailController.sendEmail(mailController.emails.invoice, "info@changeroo.com", {
        stakeholder: stakeholder,
        organisation: organisation,
        buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisation/${organisation.id}`,
        buttonText: "OPEN INVOICE",
        host: req.get('host'),
        force: true, // For testing purposes
        templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
    });

    // Clear email history for organisation expirations
    await SentEmail.where({organisation_id: organisation.id, email_code: "8a"}).destroy();
    await SentEmail.where({organisation_id: organisation.id, email_code: "8b"}).destroy();
    await SentEmail.where({organisation_id: organisation.id, email_code: "9"}).destroy();

    return res.redirect(`/plans/success`);

};


// Process a payment that comes back with an error from payment processor PayLane
const failed_payment = async (req, res) => {
    let couponObject = null;

    if(req.body.couponCode)
    {
        couponObject = await Coupon.where({code: req.body.couponCode}).fetch();
    }

    const coupon = couponObject ? couponObject.toJSON() : null;
    const paylane_id = req.body.id_error || null;
    const planObject = await Plan.where({id: parseInt(req.body.plan, 10) }).fetch();
    const organisationObject = await Organisation.where({id: parseInt(req.body.organisation, 10) }).fetch();
    const stakeholderObject = await Stakeholder.where({id: req.session.user.id}).fetch();

    const stakeholder = stakeholderObject.toJSON();
    const organisation = organisationObject.toJSON();
    const plan = planObject.toJSON();

    const paymentData = await getPaymentData(organisation, plan, coupon);

    const transaction = await Transaction.forge({
        plan_id: plan.id,
        stakeholder_id: stakeholder.id,
        organisation_id: organisation.id,
        coupon_id: (coupon) ? coupon.id : null,
        paylane_id: paylane_id,
        amount_ex_vat: paymentData.raw.subtotal,
        amount_inc_vat: paymentData.raw.total,
        vat_percentage: paymentData.vatPercentage,
        status: "ERROR"
    }).save().toJSON();

    return res.json({
        transaction,
        paymentData
    });
};



/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
//////////////////////////// GROUP: SESSIONS ////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

const locales = JSON.parse(fs.readFileSync('./locales/en.json'));

// Logs the user out
// TODO: But auth/loginController also has a signout method... And so does APIController.
const signout = (req, res) => res.json({
    user: null,
    token: '',
    organisation_members: [],
    toc_members: [],
    tocs: []
});


// TODO: Not sure what this is for...
const load = (req, res) => {

    const { user, token } = req.session;

    const models = {
        'plans': Plan,
        'mails': SentEmail,
        'tocs': Toc,
        'transaction': Transaction,
        'toc_members': TocMember,
        'stakeholders': Stakeholder,
        'organisations': Organisation,
        'organisation_members': OrganisationMember,
    };

    (function accumulate(keys, result){

        if(!keys.length) {
            result.locales = locales;
            return res.json(result);
        }

        const key = keys.pop();

        if(key == 'tocs') models[key] = models[key].query(function(qb){
            qb.orderBy('updated_at','DESC'); 
        });

        models[key].fetchAll().catch(err => res.json(err)).then(rows => {
            result[key] = rows;
            accumulate(keys, result);
        });

    }(Object.keys(models), { user, token }));

};


// For when a user sends a message through the contact/support form
const posts = (req, res) => {

    const { user, token } = req.session;

    const models = {
        'posts': Post,
    };

    (function accumulate(keys, result){

        if(!keys.length) {
            result.locales = locales;
            return res.json(result);
        }

        const key = keys.pop();

        models[key].fetchAll().catch(err => res.json(err)).then(rows => {
            result[key] = rows.map(row => JSON.parse(row.toJSON().json));
            accumulate(keys, result);
        });

    }(Object.keys(models), { user, token }));

};


// TODO: Not sure what this is for...
const admin_set = async (req, res) => {

    const Model = {
        'plan': Plan,
        'post': Post,
        'mail': SentEmail,
        'toc': Toc,
        'transaction': Transaction,
        'toc_member': TocMember,
        'stakeholder': Stakeholder,
        'organisation': Organisation,
        'organisation_member': OrganisationMember,
    }[req.body.type];

    if(!Model) return res.json({ error: 'no type given' });

    if(!req.body.payload.id) {
        
        const instance = await Model.forge(req.body.payload).save();

        return res.json(instance);

    }

    const instance = await Model.query({ where: { id: req.body.payload.id }}).fetch();

    if(!instance) return res.json({ error: 'not found' });

    await instance.save(req.body.payload, { patch: true }).catch(e=>console.log(e));

    load(req, res);

};

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
////////////////////////// GROUP: STAKEHOLDERS //////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////
//////////////////////////////// PASSWORDS //////////////////////////////
/////////////////////////////////////////////////////////////////////////
// TODO: Shouldn't this section be moved to a resetPassword controller? See resetPassword controller in /controllers/auth/

const send_stakeholder_reset_password = async (req, res) => {
    if(!req.body.email) return res.json({ error: 'missing-email' });
    const stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
    if(!stakeholder) return res.json({ error: 'no-stakeholder' });
    if(!stakeholder.get('isActivated')) return res.json({ error: 'not-yet-activated' });
    const reset_hash = await generatePasswordResetToken(stakeholder.get('id'));
    
    const update = await stakeholder.save({
        reset_hash,
        reset_sent_at: new Date()
    }, { patch: true }).catch(error => {
        console.log(error);
        res.json({ error });
    });

    if(!update) return;

    await sendPasswordResetEmail(stakeholder.get('id'), req.body.email, reset_hash, req.get('host'), stakeholder.get('full_name'));
    res.json({ success: true });
};


const reset_stakeholder_password = async (req, res) => {
    const {id, reset_hash, password} = req.body;
    if(!id || !reset_hash || !password) return res.json({ error: 'missing-fields' });
    const password_hash = await encrypt(req.body.password);

    const stakeholder = await Stakeholder.where({ id: parseInt(id, 10), reset_hash });
    console.log(String(password_hash));
    const found = await stakeholder.fetch();
    if(!found) return res.json({ error: 'invalid link' });
    
    const update = await stakeholder.save({
        password_hash: String(password_hash),
        reset_hash: null,
        reset_sent_at: null
    }, {patch: true}).catch(error => {
        console.log(error);
        res.json({ error });
    });

    if(update) res.json({ success: true });
};


///////////////////////////////////////////////////////////////////////////////
/////////////////////////// REGISTRATION & ACTIVATION /////////////////////////
///////////////////////////////////////////////////////////////////////////////
// TODO: Shouldn't this section be moved to a registration controller? See registration controller in /controllers/auth/

// Upon submitting the registration of a new user
const register_stakeholder = async(req, res) => {
    req.session['registerFormInput'] = req.body;

    const existingStakeholder = await Stakeholder.where({email: req.body.email}).fetch();
    if(existingStakeholder) return resend_stakeholder_activation(req, res);

    const errors = validate(req.body, Stakeholder.initialConstraints);
    if (errors) return res.json({ error: errors });

    const {email, full_name, username, password} = req.body;

    const emailErrors = await Stakeholder.ensureValidEmail(email);
    if(emailErrors) return res.json({ error: emailErrors });
    
    const usernameErrors = await Stakeholder.ensureValidUsername(username);
    if (usernameErrors) return res.json({ error: usernameErrors });
    
    const password_hash = await encrypt(password);
    const newStakeholderId = await Stakeholder.forge({
        email,
        full_name, 
        username,
        password_hash}).save().get('id');
    
    const token = await generateActivationToken(newStakeholderId);
    
    await sendAccountValidationEmail(newStakeholderId, email, token, req.get('host'), req.body.full_name);
    
    res.json({ success: true });
};


// TODO: What is the difference with the previous method? The method below doesn't seem to be used... Old version perhaps...?
const create_stakeholder = async (req) => {
    const { email, full_name } = req.body;
    const newStakeholderId = await Stakeholder.forge({
        email: email,
        full_name: full_name,
        username: '',
        password_hash: '',
    }).save().get('id');

    const token = await generateActivationToken(newStakeholderId);

    await sendAccountValidationEmail(newStakeholderId, email, token, req.get('host'), req.body.full_name);

    return newStakeholderId;
};


// Method to process a user clicking on the activation link sent to them by email
const activate_stakeholder = async(req, res) => {
    if (!req.body.id || !req.body.token)  return res.json({ error: 'wrong-parameters-token-link' });

    const updateEmail = req.body.update;

    stakeholder = await Stakeholder.where({id: parseInt(req.body.id, 10) }).fetch();

    if (!stakeholder)  return res.json({ error: 'wrong-email-token-link' });

    if(!updateEmail && stakeholder.get('isActivated') == 1)  return res.json({ error: 'activation.already-activated' });

    const activation_hash = stakeholder.get('activation_hash');
    if (!activation_hash)  return res.json({ error: 'activation.token-empty-in-db' });

    const isLegit = await isTokenLegitAndNotExpired(
        req.body.token.trim(), 
        activation_hash, 
        stakeholder.get('activation_sent_at'),
        ACTIVATION_TOKEN_LIFETIME);

    if (!isLegit)  return res.json({ error: 'activation.illegitimate-token' });

    // If this activation is to update a new email address
    if(updateEmail) {
        await stakeholder.save({new_email: null, email: stakeholder.get('new_email') });
        return res.json({ success: true });
    }

    await stakeholder.save({activated_at: newDateNow(), isActivated: true}, {patch: true});
console.log(stakeholder.get('email'), mailController.emails.uponFreeTrialCreation);
    await mailController.sendEmail(mailController.emails.uponFreeTrialCreation, stakeholder.get("email"), { 
        stakeholder: stakeholder.toJSON(),
        host: req.get('host')
    });

    return res.json({ success: true });
};


// Resend the activation link by email
const resend_stakeholder_activation = async (req, res) => {
    if(!req.body.email)  return res.json({ error: 'missing-email' });

    const stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
    if (!stakeholder)  return res.json({ error: 'email-not-found' });

    const token = await generateActivationToken(stakeholder.get('id'));
    await sendAccountValidationEmail(stakeholder.id, req.body.email, token, req.get('host'), stakeholder.get('full_name'));

    return res.json({ success: true });
};


///////////////////////////////////////////////////////////////////////////////
///////////////////////// DE-ACTIVATE & DESTROY USER //////////////////////////
///////////////////////////////////////////////////////////////////////////////

const deactivate_stakeholder = async (req, res) => {
    if(!req.body.id) return res.json({ error: 'stakeholders.not-found' });

    const stakeholder = await Stakeholder.where({id: req.body.id}).fetch();
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
                        console.log({ error: 'stakeholders.last-organisation-admin' });
                        return reject();
                    }

                    return resolve();
                });
            })).then(function()
            {
                return resolve();
            }).catch(function(error)
            {
                console.log(error);
                res.json({ error });
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
                        console.log({ error: 'stakeholders.last-toc-admin' });

                        return reject();
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
        }, { patch: true });

        req.session.user = null;
    
        req.session.token = null;
    
        res.clearCookie('signed_web_token');

        signout(res, req);

    }).catch(function(){

        req.session.user = null;
    
        req.session.token = null;
    
        res.clearCookie('signed_web_token');

        signout(res, req);

    });
};


// Permanently delete a user account (super admin only)
const destroy_stakeholder = async (req, res) => {
    const stakeholder = await Stakeholder.where({id: req.body.id}).fetch();
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
                        console.log({ error: 'organisations.last-organisation-admin' });
                        return reject();
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
                        console.log({ error: 'tocs.last-toc-member' });
                        return reject();
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
        if(req.body.id == req.session.user.id) {
            if(req.cookies.token) res.clearCookie('token');
            req.session.token = null;
            req.session.user = null;
        }

        console.log('success', 'stakeholders.confirm-destroy');
        return load(req, res);
    }).catch(function(){
        // One or both tests failed. Redirect to the (first) error page.
        return res.json({ error: 'tests-failed'});
    });
};


///////////////////////////////////////////////////////////////////////////////
/////////////////////////////// EDIT USER PROFILE /////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const edit_stakeholder = async (req, res) => {
    req.body = sanitize(req.body);
    req.session['editStakeholderFormInput'] = req.body;
    
    if(req.body.preview_avatar) {
       req.body.avatar = await upload_image(req.body.preview_avatar);
       delete req.body.preview_avatar;
    }

    // Validate request body
    let errors = validate(req.body, Stakeholder.mustHaveConstraints);
    if (errors) return res.json({ error: errors });

    const stakeholderModelInstance = await Stakeholder.where({id: req.session.user.id}).fetch();
    if(!stakeholderModelInstance) return res.json({ error: 'stakeholders.not-found' });
    const stakeholder = stakeholderModelInstance.toJSON();

    // Handle request for new password
    if(req.body.password) {
        if(req.body.password != req.body.password_secure) return res.json({ error: 'update.passwords-dont-match' });

        const errors = validate.single(req.body.password, {
            length: {
                minimum: 8,
                message: 'Password must be at least 8 characters'
            }
        });

        // If password input is invalid, return with flash
        if(errors) return res.json({ error: errors });

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
    if (errors) return res.json({ error: errors });

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
        if(errors) return res.json({ error: errors });

        errors = await Stakeholder.ensureValidEmail(updatedFields.new_email);

        if(errors) return res.json({ error: errors });

        // Generate new token for new email address
        const token = await generateActivationToken(stakeholder.id);

        await sendAccountValidationEmail(
            stakeholder.id,
            updatedFields.new_email,
            token,
            req.get('host'),
            updatedFields.name || stakeholder.full_name,
            { update: true }
        );
    }

    // Validate username/email only when changed
    let errs;
    if(updatedFields.username) errs = await Stakeholder.ensureValidUsername(updatedFields.username);
    if(errs) return res.json({ error: errs });

    updatedFields.custom_updated_at = newDateNow();
    updatedFields.last_login_at = newDateNow();
    if(updatedFields.isActivated) {
        updatedFields.activated_at = newDateNow();
    }
    
    delete updatedFields.activated_at;
    delete updatedFields.activation_sent_at;
    delete updatedFields.created_at;
    delete updatedFields.isActivated;
    delete updatedFields.isVerified;
    delete updatedFields.isAdmin;
    delete updatedFields.hasUsedFreeTrial;
    delete updatedFields.reset_sent_at;

    const updatedStakeholder = await stakeholderModelInstance.save(updatedFields, { patch: true }).catch((error) => {
        console.log(error);
        res.json({ error });
    });

    if(!updatedStakeholder) return;

    // Populate locals with updated stakeholder to update views
    if(stakeholder.id == req.session.user.id) req.session.user = updatedStakeholder;

    if(updatedFields.new_email && updatedFields.new_email !== stakeholder.email) {
        console.log('success', 'activation.activation-email-sent');
    } else {
        console.log('success', 'stakeholders.successful-update');
    }

    req.session['editStakeholderFormInput'] = null;

    return load(req, res);

};


///////////////////////////////////////////////////////////////////////////////
/////////////////////////// ORGANISATION ADMIN ROLE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Invite user for organisation admin role
const invite_stakeholder_as_admin = async (req, res) => {
    let organisation, stakeholder;

    if(!req.body.email || !req.body.organisation) return res.json({ error: 'no email or organisation id provided' });

    organisation = await Organisation.where({id: req.body.organisation}).fetch();

    if(!organisation) return res.json({ error: 'organisations.not-found' });

    stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
    
    if(!stakeholder) return res.json({ error: 'stakeholders.not-found' });

    const membersInstances = await organisation.getMembers(organisation.get('id'));

    const members = membersInstances.toJSON();

    // If this stakeholder is already member, return
    const isAlreadyMember = members.some(member => member.stakeholder_id == stakeholder.id);
    if(isAlreadyMember) return res.json({ error: 'invitation.already-admin-organisation' });

    // If this organisation has too many admins, return
    if(members.length >= process.env.MAX_ORGANISATION_MEMBERS) return res.json({ error: 'organisations.no-more-admins' });

    await inviteStakeholderAsOrganisationAdmin(
        stakeholder,
        organisation,
        req.get('host'),
        req.session.user.username
    );

    console.log('success', 'roles.invitation.succesfully-invited-org-admin');
    return load(req, res);
};


// Re-send the invitation for organisation admin role
const reinvite_stakeholder_as_admin = async (req, res) => {
    let organisation, stakeholder;

    if(!req.body.email || !req.body.organisation) return res.json({ error: 'no email or organisation id provided' });

    organisation = await Organisation.where({id: req.body.organisation}).fetch();

    stakeholder = await Stakeholder.where({email: req.body.email}).fetch();

    if(!organisation) return res.json({ error: 'organisations.not-found' });

    if(!stakeholder) return res.json({ error: 'stakeholders.not-found' });

    const membersInstances = await organisation.getMembers(organisation.get('id'));

    const members = membersInstances.toJSON();

    // If this stakeholder is already member, return
    const isAlreadyMember = members.some(member => member.stakeholder_id == stakeholder.id && member.isAdmin === 1);

    if(isAlreadyMember) return res.json({ error: 'roles.invitation.already-admin-organisation' });

    // If this organisation has too much admins, return
    if(members.length >= process.env.MAX_ORGANISATION_MEMBERS) return res.json({ error: 'organisations.no-more-admins' });

    await reinviteStakeholderAsOrganisationAdmin(
        stakeholder,
        organisation,
        req.get('host'),
        req.session.user.username
    );

    console.log('success', 'roles.invitation.succesfully-invited-org-admin');
    return load(req, res);
};


// Remove the invitation for organisation admin role
const remove_stakeholder_invitation = async (req, res) => {
    const sessionAdmin = await OrganisationMember.where({
        stakeholder_id: req.session.user.id,
        organisation_id: parseInt(req.body.organisation, 10),
        isAdmin: 1,
    }).fetch();
    if(!sessionAdmin) return res.json({ error: 'you-are-not-an-admin' });
    const member = await OrganisationMember.where({ id: parseInt(req.body.member, 10) }).fetch();
    if(!member) return res.json({ error: 'stakeholder-not-found' });
    await member.destroy();
    return load(req, res);
};


// Accept invitation and add organisation admin role for user
const make_stakeholder_admin = async (req, res) => {
    //TODO: Need to be logged in first? Pro: Check if session user uses activation link
    if(!req.body.token || !req.body.member) return res.json({ error: 'wrong-parameters-token-link'});

    const member = await OrganisationMember.where({ id: req.body.member }).fetch();

    if(!member) return res.json({ error: 'member.not-found' });

    // If stakeholder is already admin, return
    if(member.get('isAdmin')) return res.json({ error: 'roles.invitation.already-admin-organisation' });

    // If no activation hash exists in member row, return
    const admin_activation_hash = member.get('admin_activation_hash');

    if(!admin_activation_hash) return res.json({ error: 'roles.token.token-empty-in-db' });

    const isLegit = await isTokenLegitAndNotExpired(
        req.body.token.trim(),
        admin_activation_hash,
        member.get('admin_activation_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME);

    // If token is not legit, return
    if (!isLegit) return res.json({ error: 'roles.token.illegitimate-token' });

    await member.save({isAdmin: 1, admin_activation_hash: null, admin_activation_sent_at: null }, {patch: true});

    console.log('success', 'roles.successful-update');
    return load(req, res);
};


// Decline invitation for organisation admin role
const decline_stakeholder_admin = async (req, res) => {
    //TODO: Need to be logged in first? Pro: Check if session user uses activation link
    if(!req.body.member || !req.body.token || !req.body.invitor) return res.json({ error: 'wrong-parameters-token-link' });

    const member = await OrganisationMember.where({ id: req.body.member }).fetch();

    if(!member) return res.json({ error: 'id-not-found' });

    const invitor = await Stakeholder.where({username: req.body.invitor}).fetch();

    // If no activation hash exists in member row, return
    const admin_activation_hash = member.get('admin_activation_hash');

    if(!admin_activation_hash) return res.json({ error: 'roles.token.token-empty-in-db' });

    const isLegit = await isTokenLegitAndNotExpired(
        req.body.token.trim(),
        admin_activation_hash,
        member.get('admin_activation_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    // If token is not legit, return
    if (!isLegit) return res.json({ error: 'roles.token.illegitimate-token' });

    const organisation_id = member.get('organisation_id');

    const org = await Organisation.where({id: organisation_id}).fetch();

    await member.destroy();

    sendOrganisationRoleDeclineEmail(
        invitor.get('email'),
        req.get('host'),
        'administrator',
        org.get('name'),
        req.session.user ? req.session.user.username : 'gebruiker',
        invitor.get('full_name')
    );

    console.log('success', 'roles.successful-update');
    return load(req, res);
};


// Remove organisation admin role
const remove_organisation_admin_role = async (req, res) => {
    //TODO: Need to be logged in first? Pro: Check if session user uses activation link
    if(!req.body.member) return res.json({ error: 'wrong-parameters'});

    const member = await OrganisationMember.where({ id: req.body.member }).fetch();

    if(!member) return res.json({ error: 'member.not-found' });

    const admin = await OrganisationMember.where({
        isAdmin: 1,
        stakeholder_id: req.session.user.id,
        organisation_id: member.get('organisation_id')
    }).fetch().catch(e => console.log(e));

    // If stakeholder is not an admin, return
    if(!admin) return res.json({ error: 'You are no admin' });

    // TODO: There seems to be a missing check: namely whether user is the last organisation admin (there should always remain 1). The method below does include this check.

    // TODO: isAdmin exists at the level of organisation_members (organisation admin) as well as stakeholders (super admin). A bit confusing... Can we change the name to isOrgAdmin ?
    await member.save({ isAdmin: 0, admin_activation_hash: null, admin_activation_sent_at: null }, {patch: true});

    // TODO: No email is sent. The method below does sent an email.

    return load(req, res);
};


// TODO: What is the difference with the previous method? A search shows both methods are used in different places.
// Remove organisation admin role
const remove_stakeholder_from_organisation = async (req, res) => {
    const stakeholder = await Stakeholder.where({id: req.body.id}).fetch();

    if(!stakeholder || !req.body.organisation) return res.json({ error: 'roles.remove.user-or-organisation-not-found' });

    const organisation = await Organisation.where({ id: req.body.organisation }).fetch();

    const members = await OrganisationMember.where({ organisation_id: organisation.get('id') }).fetchAll();

    // If this stakeholder is the last admin, return
    if(members.length <= 1) return res.json({ error: 'roles.remove.last-organisation-admin' });

    // Remove stakeholder
    const member = await OrganisationMember.where({ stakeholder_id: stakeholder.get('id') }).destroy().catch(error => {
        console.log(error);
    });

    if(!member) return res.json({ error: 'no member found' });

    await sendOrganisationRoleRemovalEmail(
        stakeholder.get('email'),
        req.get('host'),
        'administrator',
        organisation.get('name'),
        req.session.user.username,
        stakeholder.get('full_name')
    );

    console.log('success', 'roles.remove.successfully-removed-as-orgadmin');

    return load(req, res);
};


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// TOC ROLE ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Invite user for a role in ToC
const invite_stakeholder_for_toc_role = async (req, res) => {
    if(req.body.email) {
        const stakeholder = await Stakeholder.where({email: String(req.body.email).toLowerCase() }).fetch();
        if(!stakeholder) return res.json({ error: 'no stakeholder found'});
        req.body.id = stakeholder.id;
    }

    if(!req.body.id || !req.body.toc_id) return res.json({ error: 'toc_id en id vereist' });
    
    const stakeholder = await Stakeholder.where({id: parseInt(req.body.id, 10) }).fetch();
    
    const toc = await Toc.query({where: {id: parseInt(req.body.toc_id, 10) }}).fetch();

    if(!toc) return res.json({ error: 'tocs.not-found' });

    if(!stakeholder) return res.json({ error: 'stakeholders.not-found' });

    const membersInstances = await toc.getMembers(toc.get('id'));

    const members = membersInstances.toJSON();

    const existingMember = members.find(member => member.stakeholder_id == stakeholder.id);

    let roles;

    switch(req.body.role) {
        case 'member':
            if(existingMember && existingMember.isMember) return res.json({ error: 'roles.invitation.already-member-toc' });
            roles = members.filter(member => member.isMember);
            if(roles.length >= process.env.MAX_TOC_MEMBERS) return res.json({ error: 'roles.invitation.maximum-toc-members-reached' });
            break;

        case 'moderator':
            if(existingMember && existingMember.isModerator) return res.json({ error: 'roles.invitation.already-moderator-toc' });
            roles = members.filter(member => member.isModerator);
            if(roles.length >= process.env.MAX_TOC_MODERATORS) return res.json({ error: 'roles.invitation.maximum-toc-moderators-reached' });
            break;

        case 'admin':
            if(existingMember && existingMember.isAdmin) return res.json({ error: 'roles.invitation.already-admin-toc' });
            roles = members.filter(member => member.isAdmin);
            if(roles.length >= process.env.MAX_TOC_ADMINS) return res.json({ error: 'roles.invitation.maximum-toc-admins-reached' });
            break;

        default:
            return res.json({ error: 'unknown-role' });
    }

    await inviteStakeholderAsTocRole(
        stakeholder,
        toc,
        req.get('host'),
        req.body.role,
        existingMember,
        req.session.user.username
    );

    console.log('success', 'roles.invitation.succesfully-invited-toc-role');
    return load(req, res);
};


// Resend an invitation for a role in a ToC
const reinvite_stakeholder_for_toc_role = async (req, res) => {
    let stakeholder, toc;

    if(req.body.id) {
        stakeholder = await Stakeholder.where({id: req.body.id}).fetch();
        toc = await Toc.where({id: req.body.toc}).fetch();
    } else return res.json({ error: 'unknown-problem' });

    if(!toc) return res.json({ error: 'tocs.not-found' });

    if(!stakeholder) return res.json({ error: 'stakeholders.not-found' });

    const membersInstances = await toc.getMembers(toc.get('id'));

    const members = membersInstances.toJSON();

    const existingMember = members.find(member => member.stakeholder_id == stakeholder.id);
    const myself = await TocMember.where({stakeholder_id: stakeholder.get("id"), toc_id: toc.get("id")}).fetch();

    let role = myself.get("admin_activation_hash") ? "admin" : null;
    role = (role == null) ? (myself.get("member_activation_hash") ? "member" : null) : role;
    role = (role == null) ? (myself.get("moderator_activation_hash") ? "moderator" : null) : role;

    switch(role) {
        case 'member':
            if(existingMember && existingMember.isMember) return res.json({ error: 'roles.invitation.already-member-toc' });
            roles = members.filter(member => member.isMember);
            if(roles.length >= process.env.MAX_TOC_MEMBERS) return res.json({ error: 'roles.invitation.maximum-toc-members-reached' });
        break;

        case 'moderator':
            if(existingMember && existingMember.isModerator) return res.json({ error: 'roles.invitation.already-moderator-toc' });
            roles = members.filter(member => member.isModerator);
            if(roles.length >= process.env.MAX_TOC_MODERATORS) return res.json({ error: 'roles.invitation.maximum-toc-moderators-reached' });
        break;

        case 'admin':
            if(existingMember && existingMember.isAdmin) return res.json({ error: 'roles.invitation.already-admin-toc' });
            roles = members.filter(member => member.isAdmin);
            if(roles.length >= process.env.MAX_TOC_ADMINS) return res.json({ error: 'roles.invitation.maximum-toc-admins-reached' });
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

    console.log('success', 'roles.invitation.succesfully-invited-toc-role');
    return load(req, res);
};


// TODO: Is remove an invitation missing for a ToC role? Or is another method used for this?


/**
 *
 * @param {*} req
 * @param {*} res
 * Accept invitation for role; adding role upon accepting
 */
const add_stakeholder_for_toc_role = async (req, res) => {
    const member = await TocMember.where({id: req.body.member}).fetch();

    const isLegit = await isTokenLegitAndNotExpired(
        req.body.token.trim(),
        member.get(`${req.body.role}_activation_hash`),
        member.get(`${req.body.role}_activation_sent_at`),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) return res.json({ error: 'illegitimate-token' });

    await member.save({
        [`is${capitalize(req.body.role)}`]: 1,
        [`${req.body.role}_activation_hash`]: null,
        [`${req.body.role}_activation_sent_at`]: null,
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

    load(req, res);
};


// Decline ToC role invitation
const decline_stakeholder_for_toc_role  = async (req, res) => {
    const member = await TocMember.where({id: req.body.member}).fetch();

    if(!member) return res.json({ error: 'member not found' });

    const toc = await Toc.where({id: member.get('toc_id')}).fetch();

    const invitor = await Stakeholder.where({username: req.body.invitor}).fetch();

    const isLegit = await isTokenLegitAndNotExpired(
        req.body.token.trim(),
        member.get(`${req.body.role}_activation_hash`),
        member.get(`${req.body.role}_activation_sent_at`),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) return res.json({ error: 'roles.token.illegitimate-token' });

    await member.save({
        [`${req.body.role}_activation_sent_at`]: null,
        [`${req.body.role}_activation_hash`]: null,
        [`is${capitalize(req.body.role)}`]: 0
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
        req.body.role,
        toc.get('name'),
        req.session.user.full_name,
        invitor.get('full_name')
    );

    console.log('success', 'tocs.successfully-declined-role');
    return load(req, res);
};


// Remove a ToC role
const remove_stakeholder_toc_role = async (req, res) => {
    console.log(req.body);
    const stakeholder = await Stakeholder.where({ email: req.body.email }).fetch();

    if(!stakeholder) return res.json({ error: 'stakeholders.not-found' });

    if(!req.body.role) return res.json({ error: 'roles.role-not-specified' });

    const member = await TocMember.where({
        stakeholder_id: stakeholder.get('id'),
        toc_id: req.body.toc
    }).fetch();

    if(!member) return res.json({ error: 'roles.member-not-found' });

    // Check if member does have this role
    const isRole = `is${capitalize(req.body.role)}`;
    const hasInvitationSentAt = `${req.body.role}_activation_sent_at`;
    const hasInvitationHash = `${req.body.role}_activation_hash`;

    if(!member.get(isRole) && !hasInvitationSentAt) return res.json({ error: 'roles.remove.role-not-found' });

    // Make sure one admin remains
    if(req.body.role == 'admin') {
        const totalMembers = await TocMember.where({
            toc_id: req.body.toc
        }).count('*');

        if(totalMembers <= 1) return res.json({ error: 'roles.remove.last-toc-admin' });
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
        const tocName = await Toc.query({where: {id: req.body.toc}}).fetch({
            columns: ['name']
        });

        await sendTocRoleRemovalEmail(
            stakeholder.get('email'),
            req.get('host'),
            req.body.role,
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

    console.log('success', 'roles.successful-update');
    return load(req, res);
};









/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
////////////////////////////// GROUP: TOCS //////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

// Create a new ToC
const create_toc = async (req, res) => {
console.log('create toc');

    if(!req.session.user) return res.json({ error: 'not-signed-in' });

    if(!req.body.username) return res.json({ error: 'unknown-problem' });

    const stakeholder = await Stakeholder.where({id: req.session.user.id}).fetch();

    if(!stakeholder) return res.json({ error: 'stakeholders.not-found'});

    if(!req.body.organisation_id) return res.json({ error: 'organisation_id.not-found'});

    const organisationMember = await OrganisationMember.where({
        isAdmin: 1,
        stakeholder_id: stakeholder.get("id"),
        organisation_id: req.body.organisation_id
    }).fetch().catch(e => console.log(e));

    if(!organisationMember && !req.session.user.isAdmin) return res.json({ error: 'organisations.administrators-only'});
    
    if(!req.body.name || !req.body.organisation_id) return res.json({ error: 'tocs.missing-toc-or-organisation' });
    
    const organisation = await Organisation.where({id: req.body.organisation_id}).fetch();
    const plan = await Plan.where({id: organisation.get('plan_id')}).fetch();
    const currentTocCount = await Toc.where({organisation_id: organisation.get("id"), isActivated: 1}).count('*');

    if(currentTocCount >= plan.get('max_tocs') && !req.session.user.isAdmin) return res.json({ error: 'plans.maximum-tocs-reached' });
    
    let errors = await Toc.ensureValidName(req.body.name);

    if(errors) return res.json({ error: errors });

    const tocUUID = uuid();


    if(req.body.delete_avatar) {
        req.body.avatar = "";
        await fs.unlink(
            path.join(__dirname, `../client/uploads/${toc.avatar}`),
            () => {}
        );
    } else if (req.body.preview_avatar) req.body.avatar = await upload_image(req.body.preview_avatar);

    toc = await Toc.forge({
        uuid: tocUUID,
        name: req.body.name,
        organisation_id: req.body.organisation_id,
        isActivated: 1,
        visibility: 1,
        shouldBeDestroyed: 0,
        short_description: req.body.short_description || '',
        about: req.body.about || '',
        size_revenue: req.body.size_revenue || '',
        categories: req.body.categories || '',
        regions: req.body.regions || '',
        avatar: req.body.avatar || '',
        website: req.body.website || '',
        facebook: req.body.facebook || '',
        instagram: req.body.instagram || '',
        google_plus: req.body.google_plus || '',
        linkedin: req.body.linkedin || '',
        pinterest: req.body.pinterest || '',
        twitter: req.body.twitter || '',
    }).save();

    if((currentTocCount + 1) === plan.get("max_tocs") && currentTocCount > 0)  {
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

    load(req, res);

};


// Edit a ToC profile
const edit_toc = async (req, res) => {

    req.body = sanitize(req.body);

    req.session['editTocFormInput'] = req.body;

    if(req.session.user.isAdmin) {
        if(!req.body.isActivated) req.body.isActivated = 0;
        if(!req.body.shouldBeDestroyed) req.body.shouldBeDestroyed = 0;
    }

    const errors = validate(req.body, Toc.updateConstraints);

    if (errors) return res.json({ error: errors });

    const tocInstance = await Toc.query({where: {uuid: req.body.uuid}}).fetch();
    
    if(!tocInstance) return res.json({ error: 'tocs.not-found' });

    const toc = tocInstance.toJSON();

    if(req.body.delete_avatar) {
        req.body.avatar = "";
        await fs.unlink(
            path.join(__dirname, `../client/uploads/${toc.avatar}`),
            () => {}
        );
    } else if (req.body.preview_avatar) req.body.avatar = await upload_image(req.body.preview_avatar);

    const updatedFields = getUpdatedFields(req.body, toc);

    if(updatedFields.name) {
        const error = await Toc.ensureValidName(updatedFields.name);
        if(error) return res.json({ error: error });
    }

    if(req.session.user.isAdmin && updatedFields.isActivated) {
        firebase.database().ref(`/projects/${toc.uuid}`).update({is_activated: updatedFields.isActivated});
    }
    
    delete updatedFields.created_at;

    updatedFields.shouldBeDestroyed = updatedFields.shouldBeDestroyed || 0;
    
    await tocInstance.save(updatedFields, {patch: true}).catch(e=>console.log(e));

    await tocInstance.syncToFirebase();

    req.session['editTocFormInput'] = null;

    load(req, res);

};


// Destroy (permanently remove) a ToC
// TODO: Check if also at the server side, only a super admin can do this. If this is not set correctly, let Martin know. Because there might be similar security issues at other places as well!
const destroy_toc = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.body.uuid}}).fetch();
    const members = await toc.getMembers(toc.get('id'));
    await Promise.all(members.forEach(async member => { await member.destroy(); }));
    await toc.deleteFromFirebase();
    await toc.destroy();
    load(req, res);
};


///////////////////////////////////////////////////////////////////////////////
/////////////////////////////// ARCHIVE TOCS //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Switch state of ToC between active and inactive
const switch_toc_active_state = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.body.uuid}}).fetch();
    const organisation = await Organisation.query({where: {id: toc.get("organisation_id")}}).fetch();
    const affiliateProgramPlan = await Plan.query({where: {name: process.env.AFFILIATE_PROGRAM_PLAN_NAME }}).fetch();

    if(organisation.get("plan_id") === affiliateProgramPlan.get("id")) return res.json({ error: 'tocs.disallowed-state-switch' });

    const newState = toc.get('isActivated') ? 1 : 0;

    await toc.save({isActivated: newState}, {patch: true});

    firebase.database().ref(`/projects/${toc.get('uuid')}`).update({is_activated: newState});

    load(req, res);
};


// De-activate (archive) a ToC
// TODO: Why do we need this method, given that we already have the previous method "switch_toc_active_state"?
const deactivate_toc = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.body.uuid}}).fetch();
    if(!toc) return res.json({ error: 'tocs.not-found' });
    await toc.deactivate(toc);
    load(req, res);
};


///////////////////////////////////////////////////////////////////////////////
//////////////////////////// CREATE A COPY OF A TOC ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Create a copy of a ToC
const copy_toc = async (req, res) => {
    const toc = await Toc.query({where: {uuid: req.body.uuid }}).fetch().catch(e => console.log(22, e));
    const organisation = await Organisation.query({ where: { id: toc.get("organisation_id") }}).fetch();
    const plan = await Plan.query({ where: { id: organisation.get("plan_id") }}).fetch();
    const activeTocs =  await Toc.where({organisation_id: organisation.get("id"), isActivated: 1}).count('*');

    if(activeTocs >= plan.get('max_tocs')) return res.json({ error: 'plans.maximum-tocs-reached' });
    
    const date1 = organisation.get("subs_exp_date");
    const date2 = new Date();
    date2.setHours(0, 0, 0, 0);
    var timeDiff = date1.getTime() - date2.getTime();
    var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if(remainingDays < 0) return res.json({ error: 'plans.plan-expired' });

    if(!toc) return res.json({ error: 'tocs.not-found' });

    const keepPermissions = (req.body && req.body.keep_permissions);
    const newUuid = await toc.copy(keepPermissions, req.session.user.id);

    if(!newUuid) return res.json({ error: 'failed-copied' });

    const newId = await Toc.forge({
        uuid: newUuid,
        name: toc.get("name") + " (copy)",
        organisation_id: toc.get("organisation_id"),
        isActivated: toc.get("isActivated"),
        short_description: toc.get("short_description"),
        about: toc.get("about"),
        avatar: toc.get("avatar"),
        categories: toc.get("categories"),
        visibility: toc.get("visibility"),
        shouldBeDestroyed: toc.get("shouldBeDestroyed")
    }).save().get("id");

    if(keepPermissions) {
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
    } else {
        await TocMember.forge({
            stakeholder_id: req.session.user.id,
            toc_id: newId,
            isAdmin: 1,
            isMember: 1,
            isModerator: 1
        }).save();
    }
    
    load(req, res);

};


///////////////////////////////////////////////////////////////////////////////
////////////// MOVE A TOC TO A DIFFERENT ORGANISATION ACCOUNT /////////////////
///////////////////////////////////////////////////////////////////////////////

// Invite another user to take over the ToC
const init_move_toc = async (req, res) => {
    const toc = await Toc.query({where: {id: req.body.id}}).fetch().catch(e => {
        console.log(e);
    });

    if(!toc) return res.json({ error: 'tocs.not-found' });

    const stakeholder = await Stakeholder.where({email: req.body.email}).fetch();

    if(!stakeholder) return res.json({ error: 'stakeholders.not-found' });

    await inviteStakeholderToMoveToC(
        stakeholder,
        toc,
        req.get('host'),
        req.session.user.username
    );

    load(req, res);
};


// Invited user moves the ToC to one of his accounts
const move_toc = async (req, res) => {
    const toc = await Toc.query({where: {
        movement_username: req.session.user.username,
        uuid: req.body.uuid
    }}).fetch();

    if(!toc) return res.json({ error: 'tocs.not-found' });

    if(!req.body.organisation) return res.json({ error: 'tocs.no-organisation' });

    const isLegit = await isTokenLegitAndNotExpired(
        req.body.token.trim(),
        toc.get("movement_hash"),
        toc.get('movement_sent_at'),
        process.env.ACTIVATION_TOKEN_LIFETIME
    );

    if(!isLegit) return res.json({ error: 'roles.token.illegitimate-token' });

    let organisationsQuery = bookshelf.knex.select("organisations.*", "plans.name AS plan", "plans.max_tocs AS max_tocs", bookshelf.knex.raw("(SELECT COUNT (*) FROM tocs WHERE tocs.isActivated = 1 AND tocs.organisation_id = organisations.id) AS toc_amount")).from("organisations").innerJoin("plans", function(){
        this.on("plans.id", "=", "organisations.plan_id");
    }).where({id: req.body.organisation}).first();

    const organisation = await organisationsQuery;

    if(!organisation) return res.json({ error: 'organisations.not-found' });

    /*  - activated
        - plan's expiration date shouldn't be expired
        - Nog niet aan maximum aantal ToCs zitten */

    if(!organisation.isActivated) return res.json({ error: 'organisations.not-activated' });

    let today = new Date();

    var convertDateToString = function(date){
        return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    };

    if(organisation.subs_exp_date < today && (convertDateToString(organisation.subs_exp_date) !== convertDateToString(today)))
        return res.json({ error: 'plans.plan-expired' });

    if(organisation.max_tocs <= organisation.toc_amount) return res.json({ error: 'plans.maximum-tocs-reached' });

    toc.moveToOrganisation(organisation);

    await toc.save({
        organisation_id: organisation.id,
        movement_hash: null,
        movement_sent_at: null,
        movement_username: null
    }, {patch: true});

    load(req, res);
};


///////////////////////////////////////////////////////////////////////////////
/////////////////////////// TOC AFFILIATE PROGRAM /////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// TODO: What is this method for? Is it perhaps: to automatically make ToCs that are part of the ToC Affiliate program inactive after 3 months?
const update_toc_affiliate_program = async () => {
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
};


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
///////////////////////// GROUP: ORGANISATIONS //////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

// Create a new organisation, with a free trial subscription
const create_free_organisation = async (req, res) => {

    if(!req.session || !req.session.user) return res.json({ error: 'no-username' });
    
    const stakeholder = await Stakeholder.where({ id: req.session.user.id }).fetch();
    const freePlan = await Plan.where({price: 0.00}).fetch();

    if(stakeholder.get('hasUsedFreeTrial') && !req.session.user.isAdmin) return res.json({ error: 'organisations.out-of-free-trial' });

    if(!req.body.name) return res.json({ error: 'organisations.missing-name' });

    let errors = validate.single(req.body.name, Organisation.constraints.name) ||
                    await Organisation.ensureValidName(req.body.name);

    if(errors) {
        req.session['newPremiumOrganisationModalErrors'] = 1;
        return res.json({ error: errors });
    }

    const slugname = slug(req.body.name, {lower: true});
    const organisationCheck = await Organisation.where({slug: slugname}).fetch();

    if(organisationCheck) return res.json({ error: 'organisations.duplicate-name' });

    const newOrganisation = {
        name: req.body.name,
        slug: slugname,
        // ID: 1 = Free plan
        plan_id: freePlan.get('id'),
        subs_exp_date: addDays(newDateNow(), freePlan.get('period')),
        isActivated: true,
        activated_at: newDateNow(),
        city: req.body.city || '',
        address: req.body.address || '',
        country: req.body.country || '',
        website: req.body.website || '',
    };

    if(req.body.preview_avatar) newOrganisation.avatar = await upload_image(req.body.preview_avatar);

    const organisation = await Organisation.forge(newOrganisation).save();
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

    console.log('success', `New organisation ${req.body.name} was successfully created!`);
    return load(req, res);
};


// Create a new organisation, with another subscription than a free trial
const create_premium_organisation = async (req, res) => {
    if(!req.body.username || !req.body.plan_id) return res.json({ error: 'missing-fields' });

    const stakeholder = await Stakeholder.where({username: req.body.username}).fetch();
    const plan = await Plan.where({id: req.body.plan_id}).fetch();

    if(!stakeholder || !plan) return res.json({ error: 'organisations.user-or-plan-not-found' });

    let errors = validate(req.body, Organisation.initialPremiumConstraints) ||
                    await Organisation.ensureValidName(req.body.name);

    if(errors) {
        req.session['newPremiumOrganisationModalErrors'] = 1;
        req.session['newPremiumOrganisationModalOpen'] = req.body.modalIdentifier;
        return res.json({ error: errors });
    }
    const slugname = slug(req.body.name, {lower: true});
    const organisationCheck = await Organisation.where({slug: slugname}).fetch();

    if(organisationCheck) return res.json({ error: 'organisations.duplicate-name' });

    let subs_exp_date = newDateYesterday();

    if(req.session.user.isAdmin) {
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

    const newOrganisation = {
        name: req.body.name,
        slug: slugname,
        country: req.body.country || '',
        city: req.body.city || '',
        website: req.body.website || '',
        address: req.body.address || '',
        plan_id: plan.get('id'),
        subs_exp_date: subs_exp_date,
        isActivated: true,
        activated_at: newDateNow(),
        vat_number: req.body.vat_number,
        hasVatNumber: req.body.hasVatNumber,
        isValidVatNumber: req.body.isValidVatNumber
    };

    if(req.body.preview_avatar) newOrganisation.avatar = await upload_image(req.body.preview_avatar);

    const organisation = await Organisation.forge(newOrganisation).save();

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

    console.log('success', 'organisations.successfully-created');
    return load(req, res);
};


// Edit organisation profile
const edit_organisation = async (req, res) => {
    req.body = sanitize(req.body);
    req.session['editOrganisationFormInput'] = req.body;
    if(!req.body.hasVatNumber) req.body.hasVatNumber = 0;

    if(req.session.user.isAdmin) {
        if(!req.body.isActivated) req.body.isActivated = 0;
        if(!req.body.isValidVatNumber) req.body.isValidVatNumber = 0;
    }


    const organisationInstance = await Organisation.where({id: req.body.id}).fetch();

    if(!organisationInstance) return res.json({ error: 'organisations.not-found' });

    const organisation = organisationInstance.toJSON();

    // Delete avatar if checked
    if (req.body.delete_avatar) {
        req.body.avatar = "";
        await fs.unlink(
            path.join(__dirname, `../public/uploads/${organisation.avatar}`),
            () => {}
        );
    }
    
    if(req.body.preview_avatar) req.body.avatar = await upload_image(req.body.preview_avatar);

    const updatedFields = getUpdatedFields(req.body, organisation);

    const errors = validate(updatedFields, Organisation.updateConstraints);

    if(errors) return res.json({ error: errors });

    // Ensure valid organisation name
    if(updatedFields.name) {
        const nameError = await Organisation.ensureValidName(updatedFields.name);
        if(nameError) return res.json({ error: nameError });
    }

    let flash;
    if(updatedFields.vat_number) {
        // If a new vat number has been entered
        if(updatedFields.vat_number.length > 0) {
            if(!updatedFields.country && !organisation.country) return res.json({ error: 'organisations.country-before-vat' });
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

            if(flash) return console.log(22, flash);

            // Check if a flash message was returned
            updatedFields.isValidVatNumber = typeof flash == 'string' ? 0 : 1;
        } else {
            updatedFields.isValidVatNumber = 0;
        }
    }

    await organisationInstance.save(updatedFields, {patch: true});

    console.log('success', 'organisations.successfully-updated');

    req.session['editOrganisationFormInput'] = null;
    return load(req, res);
};


///////////////////////////////////////////////////////////////////////////////
//////////////////////// DELETE & DESTROY ORGANISATION ////////////////////////
///////////////////////////////////////////////////////////////////////////////


// De-activate (delete, but not yet permanent, an organisation)
const deactivate_organisation = async (req, res) => {
    if(!req.body.id) return res.json({ error: 'organisations.not-found' });

    const organisation = await Organisation.where({id: req.body.id}).fetch();

    if(!organisation) return res.json({ error: 'organisations.not-found' });

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
        console.log('info', `${''.concat(...deactivatedTocs.join(', '))} have been deleted`);
        console.log('success', 'organisations.deactivated-organisation-with-active-tocs');
        return load(req, res);
    }

    console.log('success', 'organisations.deactivated-organisation-without-active-tocs');
    return load(req, res);
};


// Destroy (permanently delete) organisation account
const destroy_organisation = async (req, res) => {
    if(!req.body.id) return res.json({ error: 'organisations.not-found' });

    const organisation = await Organisation.where({ id: req.body.id }).fetch();

    if(!organisation) return res.json({ error: 'organisations.not-found' });

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
        console.log('info', `${''.concat(...deactivatedTocs.join(', '))} have been deleted`);
        console.log('success', 'organisations.destroy-confirmation-with-active-tocs');
        return load(req, res);
    }

    console.log('success', 'organisations.destroy-confirmation-without-active-tocs');
    return load(req, res);
};


///////////////////////////////////////////////////////////////////////////////
//////////////////// CHANGE SUBSCRIPTION OF ORGANISATION //////////////////////
///////////////////////////////////////////////////////////////////////////////

// Extend the free trial with a number of days. Users get this offer once by e-mail.
const extend_organisation_trial = async (req, res) => {
    if(!req.body.id) return res.json({ error: 'organisations.not-found' });

    const organisation = await Organisation.where({id: req.body.id}).fetch();

    if(!organisation) return res.json({ error: 'organisations.not-found' });

    if(organisation.get("extend_trial")) return res.json({ error: 'organisations.already-extended-trial' });

    await organisation.save({
        subs_exp_date: new Date(+new Date + 604800000).toISOString().substring(0, 10), // Today + 7 days
        extend_trial: 1
    }, {patch: true});

    // Delete history of extension emails
    await SentEmail.where({organisation_id: organisation.get('id'), email_code: 6}).destroy();

    console.log('success', 'organisations.extended-trial');
    return load(req, res);
};


//TODO:
// Upgrade an existing organisation's subscription plan
const upgrade_organisation_plan = async (req, res) => {
    
};


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
///////////////////////////// TOC ACADEMY ///////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

const load_toc_academy = async (req, res) => {
    let byTopics;
    let languages;
    let latestPosts;
    let currentLanguage;
    let events;
    let notYetApproved;

    if(req.posts && req.byTopics)
    {
        const posts = filterByTocAcademyCategory(req.posts);
        languages = getAllLanguages(posts);
        byTopics = req.byTopics;

        if(req.query.language && languages.includes(req.query.language)) {
            byTopics = filterTopicsByLanguage(req.query.language, byTopics);
        }

        events = [];
        if('Events' in byTopics && byTopics['Events'].posts)
        {
            events = byTopics['Events'].posts;
        }

        byTopics["Latest Posts"] = {
            name: "Latest Posts",
            uuid: null,
            posts: sortPostsByPublicationDate(filterPostsByAcceptedForPublication(req.posts, true)).slice(0, 5),
            fullTopic: null
        };
    }
    else
    {
        req.posts = [];
        byTopics = {},
        languages = [];
        latestPosts = [];
        currentLanguage = "";
        events = [];
        notYetApproved = [];
    }

    return res.json({
        title: 'ToC Academy',
        byTopics: sortTopicsByFixedTopicsOrder(
            sortTopicsBySticky(
                sortTopicsByPublicationDate(
                    filterTopicsByAcceptedForPublication(byTopics, true)
                )
            )
        ),
        languages,
        currentLanguage: req.query.language,
        latestPosts: sortPostsByPublicationDate(filterPostsByAcceptedForPublication(req.posts, true)).slice(0, 5),
        notYetApproved: filterPostsByAcceptedForPublication(req.posts, false).slice(0, 5),
        events: filterPostsByAcceptedForPublication(events, true)
    });
};

// TODO: This controller doesn't seem to be finished...


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////// EXPORTS /////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

module.exports = {

    // payments
    apply_payment_coupon,
    checkout_payment,
    complete_payment,
    complete_payment_changeroo,
    failed_payment,

    // sessions
    signout,
    load,
    posts,
    admin_set,

    // stakeholders
    reset_stakeholder_password,
    send_stakeholder_reset_password,
    register_stakeholder,
    activate_stakeholder,
    resend_stakeholder_activation,
    remove_organisation_admin_role,
    edit_stakeholder,
    deactivate_stakeholder,
    destroy_stakeholder,
    remove_stakeholder_from_organisation,
    reinvite_stakeholder_as_admin,
    make_stakeholder_admin,
    invite_stakeholder_as_admin,
    decline_stakeholder_admin,
    invite_stakeholder_for_toc_role,
    reinvite_stakeholder_for_toc_role,
    remove_stakeholder_toc_role,
    decline_stakeholder_for_toc_role,
    add_stakeholder_for_toc_role,
    remove_stakeholder_invitation,

    // tocs
    create_toc,
    edit_toc,
    copy_toc,
    move_toc,
    init_move_toc,
    deactivate_toc,
    destroy_toc,
    switch_toc_active_state,
    update_toc_affiliate_program,

    // organisations
    create_free_organisation,
    create_premium_organisation,
    edit_organisation,
    destroy_organisation,
    extend_organisation_trial,
    deactivate_organisation,
    upgrade_organisation_plan,

    // toc_academy
    load_toc_academy,

};
