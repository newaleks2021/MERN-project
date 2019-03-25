const bookshelf = require('../db');
const Plan = require('../models/plan');
const Organisation = require('../models/organisation');
const Stakeholder = require('../models/stakeholder');
const SentEmail = require('../models/sent_email');
const Coupon = require('../models/coupon');
const Transaction = require('../models/transaction');
const { countriesList, getCountryByCode, isEUCountry } = require('../helpers/countriesList');
const sha1 = require('sha1');
const mailController = require('./mailController');

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
}

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
}

/**
 *
 * @param {*} description
 * @param {*} amount
 * @param {*} currency
 * @param {*} transaction_type
 */
const generateRequestPaylaneHash = (description, amount, currency, transaction_type) => {
    const hash = sha1(process.env.PAYLANE_SALT + "|" + description + "|" + amount + "|" + currency + "|" + transaction_type);

    return hash;
}

/**
 *
 * @param {*} description
 * @param {*} amount
 * @param {*} currency
 * @param {*} transaction_type
 */
const generateResponsePaylaneHash = (status, description, amount, currency, id) => {
    const hash = sha1(process.env.PAYLANE_SALT + "|" + status + "|" + description + "|" + amount + "|" + currency + "|" + id)

    return hash;
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const failedPayment = async (req, res) => {
    let couponObject = null;

    if(req.params.couponCode)
    {
        couponObject = await Coupon.where({code: req.params.couponCode}).fetch();
    }

    const coupon = couponObject ? couponObject.toJSON() : null;
    const paylane_id = (req.query.id_error) ? req.query.id_error : null;
    const planObject = await Plan.where({id: req.params.id}).fetch();
    const organisationObject = await Organisation.where({slug: req.params.slug}).fetch();
    const stakeholderObject = await Stakeholder.where({username: req.session.user.username}).fetch();

    const stakeholder = stakeholderObject.toJSON();
    const organisation = organisationObject.toJSON();
    const plan = planObject.toJSON();

    const paymentData = await getPaymentData(organisation, plan, coupon);

    const transactionId = await Transaction.forge({
        plan_id: plan.id,
        stakeholder_id: stakeholder.id,
        organisation_id: organisation.id,
        coupon_id: (coupon) ? coupon.id : null,
        paylane_id: paylane_id,
        amount_ex_vat: paymentData.raw.subtotal,
        amount_inc_vat: paymentData.raw.total,
        vat_percentage: paymentData.vatPercentage,
        status: "ERROR"
    }).save().get('id');

    return res.render('web/checkout-failed', {
        title: "Payment failed"
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const completePaymentChangeroo = async (req, res) => {
    let couponObject = null;

    if(req.params.couponCode)
    {
        couponObject = await Coupon.where({code: req.params.couponCode}).fetch();
    }

    const coupon = couponObject ? couponObject.toJSON() : null;

    const requiredFields = ["amount", "currency", "description", "hash"];
    for(var i = 0; i < requiredFields.length; i++)
    {
        const requiredField = requiredFields[i];

        if(!(requiredField in req.body))
        {
            if(coupon)
            {
                return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/coupon/${coupon.code}/failed?id_error=201`);
            }
            else
            {
                return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/failed?id_error=201`);
            }
        }
    }

    // Check integrity of payment
    const planId = parseInt(req.body.description.replace("plan-", ""));
    const planObject = await Plan.where({id: req.params.id}).fetch();
    const organisationObject = await Organisation.where({slug: req.params.slug}).fetch();
    const stakeholderObject = await Stakeholder.where({username: req.session.user.username}).fetch();

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
              buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisations/${organisation.slug}/transaction/${transactionId.toString().length}/${transactionId}0/pdf`,
              buttonText: "OPEN INVOICE",
              host: req.get('host'),
              force: true, // For testing purposes
              templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });

            await mailController.sendEmail(mailController.emails.invoice, "info@changeroo.com", {
              stakeholder: stakeholder,
              organisation: organisation,
              buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisations/${organisation.slug}/transaction/${transactionId.toString().length}/${transactionId}${req.query.id_sale}/pdf`,
              buttonText: "OPEN INVOICE",
              host: req.get('host'),
              force: true, // For testing purposes
              templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });

            return res.redirect(`/plans/success`);
        }
    }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const completePayment = async (req, res) => {
    let couponObject = null;

    if(req.params.couponCode)
    {
        couponObject = await Coupon.where({code: req.params.couponCode}).fetch();
    }

    const coupon = couponObject ? couponObject.toJSON() : null;

    if("id_error" in req.query)
    {
        if(coupon)
        {
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/coupon/${coupon.code}/failed?id_error=${req.query.id_error}`);
        }
        else
        {
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/failed?id_error=${req.query.id_error}`);
        }
    }

    const requiredFields = ["status", "amount", "currency", "description", "hash", "id_sale"];
    for(var i = 0; i < requiredFields.length; i++)
    {
        const requiredField = requiredFields[i];

        if(!(requiredField in req.query))
        {
            if(coupon)
            {
                return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/coupon/${coupon.code}/failed?id_error=201`);
            }
            else
            {
                return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/failed?id_error=201`);
            }
        }
    }

    // Check integrity of payment
    const hash = generateResponsePaylaneHash(req.query.status, req.query.description, req.query.amount, req.query.currency, req.query.id_sale);
    if(hash !== req.query.hash)
    {
        if(coupon)
        {
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/coupon/${coupon.code}/failed?id_error=202`);
        }
        else
        {
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/failed?id_error=202`);
        }
    }

    const planId = parseInt(req.query.description.replace("plan-", ""));
    const planObject = await Plan.where({id: req.params.id}).fetch();
    const organisationObject = await Organisation.where({slug: req.params.slug}).fetch();
    const stakeholderObject = await Stakeholder.where({username: req.session.user.username}).fetch();

    const stakeholder = stakeholderObject.toJSON();
    const organisation = organisationObject.toJSON();
    const plan = planObject.toJSON();

    if(planId === plan.id)
    {
        const paymentData = await getPaymentData(organisation, plan, coupon);

        const amount_inc_vat = parseFloat(req.query.amount);
        const amount_ex_vat = amount_inc_vat / ((100 + paymentData.vatPercentage) / 100);

        const transactionId = await Transaction.forge({
            plan_id: plan.id,
            stakeholder_id: stakeholder.id,
            organisation_id: organisation.id,
            coupon_id: (coupon) ? coupon.id : null,
            paylane_id: req.query.id_sale,
            amount_ex_vat: amount_ex_vat,
            amount_inc_vat: amount_inc_vat,
            vat_percentage: paymentData.vatPercentage,
            status: req.query.status
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
          buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisations/${organisation.slug}/transaction/${transactionId.toString().length}/${transactionId}${req.query.id_sale}/pdf`,
          buttonText: "OPEN INVOICE",
          host: req.get('host'),
          force: true, // For testing purposes
          templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
        });

        await mailController.sendEmail(mailController.emails.invoice, "info@changeroo.com", {
          stakeholder: stakeholder,
          organisation: organisation,
          buttonUrl: `${process.env.PROTOCOL}${req.get('host')}/organisations/${organisation.slug}/transaction/${transactionId.toString().length}/${transactionId}${req.query.id_sale}/pdf`,
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
    }
    else
    {
        if(coupon)
        {
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/coupon/${coupon.code}/failed?id_error=200`);
        }
        else
        {
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/failed?id_error=200`);
        }
    }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const displaySuccessPayment = async (req, res) => {
  return res.render('web/checkout-success', {
      title: "Payment succeeded"
  });
}
/**
 *
 * @param {*} req
 * @param {*} res
 */
const getPaymentData = async (organisation, plan, coupon) => {
    const currencySymbol = getCurrencySymbol(plan.currency);
    const currencyCode = plan.currency.toUpperCase();

    // Calculate discount
    const date1 = organisation.subs_exp_date;
    const date2 = new Date()
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
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const applyCoupon = async (req, res) => {
    if(!req.body.coupon)
    {
        req.flash('error', __('flashes.invalid-coupon-code'));
        return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
    }

    const coupon = await Coupon.where({code: req.body.coupon}).fetch();
    if(!coupon)
    {
        req.flash('error', __('flashes.invalid-coupon-code'));
        return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
    }

    // Check max uses
    const transactionWithCouponCountQuery = await bookshelf.knex("transactions").whereRaw("coupon_id = ?", [coupon.get("id")]).count("id as count");
    const transactionWithCouponCount = transactionWithCouponCountQuery[0].count;

    if(coupon.get("max_use") > 0 && transactionWithCouponCount >= coupon.get("max_use"))
    {
        req.flash('error', __('flashes.coupon-code-max-used'));
        return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
    }

    // Check expiration date
    const date1 = coupon.get("exp_date");

    if(date1)
    {
        const date2 = new Date()
        date2.setHours(0, 0, 0, 0);
        var timeDiff = date1.getTime() - date2.getTime();
        var remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if(remainingDays < 0)
        {
            req.flash('error', __('flashes.coupon-code-expired'));
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
        }
    }

    // Check if valid for plan
    const planId = coupon.get("plan_id")
    if(planId && planId.toString() !== req.params.id)
    {
        req.flash('error', __('flashes.coupon-code-not-applicable'));
        return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
    }

    // Check if valid-for has not expired
    const validFor = parseInt(coupon.get("valid_for"));
    const organisation = await Organisation.where({slug: req.params.slug}).fetch();
    const createdAt = organisation.get("created_at");
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

    if(secondsSinceCreation > (validFor * 3600))
    {
        req.flash('error', __('flashes.coupon-code-no-longer-valid'));
        return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
    }

    return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}/coupon/${coupon.get("code")}`);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
const checkout = async (req, res) => {
    const planObject = await Plan.where({id: req.params.id}).fetch();
    const organisationObject = await Organisation.where({slug: req.params.slug}).fetch();
    const stakeholderObject = await Stakeholder.where({username: req.session.user.username}).fetch();
    let couponObject = null;

    if(req.params.couponCode)
    {
        couponObject = await Coupon.where({code: req.params.couponCode}).fetch();
    }

    const organisation = organisationObject.toJSON();
    const stakeholder = stakeholderObject.toJSON();
    const plan = planObject.toJSON();
    const coupon = couponObject ? couponObject.toJSON() : null;

    const host = req.get('host');
    const paymentData = await getPaymentData(organisation, plan, coupon);

    if(coupon)
    {
        // Check if valid for plan
        const planId = coupon.plan_id;
        if(planId && planId.toString() !== req.params.id)
        {
            req.flash('error', __('flashes.coupon-code-not-applicable'));
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
        }

        // Check if valid-for has not expired
        const validFor = parseInt(coupon.valid_for);
        const createdAt = organisation.created_at;
        const now = new Date();
        const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

        if(secondsSinceCreation > (validFor * 3600))
        {
            req.flash('error', __('flashes.coupon-code-no-longer-valid'));
            return res.redirect(`/plans/${req.params.id}/checkout/${req.params.slug}`);
        }
    }

    if(!organisation.country || !organisation.address || !paymentData.countryCode)
    {
        req.flash('error', __('flashes.missing-country-address'));
        return res.redirect(`/organisations/${req.params.slug}/edit`);
    }

    if(organisation.plan_id === plan.id && paymentData.remainingDays > process.env.REMIND_UPGRADE_PLAN_DURATION)
    {
        req.flash('error', __('flashes.not-eligble-for-extension'));
        return res.redirect(`/plans/${organisation.slug}`);
    }

    return res.render('web/checkout', Object.assign({}, {
        title: __('views.page-titles.checkout'),
        organisation: organisation,
        stakeholder: stakeholder,
        plan: plan,
        coupon: coupon,
        back_url: (coupon) ? `${process.env.PROTOCOL}${host}/plans/${plan.id}/checkout/${organisation.slug}/coupon/${coupon.code}/complete` : `${process.env.PROTOCOL}${host}/plans/${plan.id}/checkout/${organisation.slug}/complete`,
        hash: generateRequestPaylaneHash(`plan-${plan.id}`, paymentData.raw.total, paymentData.currencyCode, "S")
    }, paymentData));
}

module.exports = {
    checkout,
    completePayment,
    completePaymentChangeroo,
    failedPayment,
    formatMoney,
    applyCoupon,
    displaySuccessPayment
}
