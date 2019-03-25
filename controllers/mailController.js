const bookshelf = require('../db');
const fs = require('fs');
const pug = require('pug');
const helper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
const Stakeholder = require('../models/stakeholder');
const Organisation = require('../models/organisation');
const SentEmail = require('../models/sent_email');
const firebase = require('./firebaseController');

// Defines all the emails within the email funnel, as well as when subscription has expired, the ToC-max of subscription has been reached, and when invoices for transactions are sent.
const emails = {
    uponFreeTrialCreation: "1",
    uponCreatingFreeOrganisation: "2a",
    uponCreatingPaidOrganisation: "2b",
    twoDayNudge: "3a",
    fourteenDayAccountReview: "3b",
    twentyDaysNotLoggedIn: "4a",
    twoMonthsNotLoggedIn: "4b",
    trialExpiryWarning: "5",
    extendTrial: "6",
    thirtyDaysAfterTrialExpired: "7",
    twentyDaysSubscriptionWillExpire: "8a",
    fiveDaysSubscriptionWillExpire: "8b",
    subscriptionExpired: "9",
    hitPlanLimit: "10",
    invoice: "11"
};

// Testing cron jobs that send emails
// TODO: Shouldn't this be moved to the "test" folder...?
const test = async function (req, res) {
    const colors = require('colors');

    executeCrons().then(function () {
        console.log(colors.green("[CRON] Sending emails succeeded."));
    }).catch(function () {
        console.log(colors.red(`[CRON] Sending emails failed.`));
    });

    return res.json({ "status": "OK" });

    const to = "martin.h.klein@gmail.com";

    //res = await send("A new way to test out Changeroo", "./views/mailings/7_30daysAfterTrialExpired.pug", to, options);
    const status = await sendEmail(emails.thirtyDaysAfterTrialExpired, to, {
        stakeholder: (await Stakeholder.where({ id: 24 }).fetch()).toJSON(),
        organisation: (await Organisation.where({ id: 18 }).fetch()).toJSON(),
        hasOrgOrToc: true,
        host: req.get('host'),
        force: true
    });

    if (status) {
        return res.json({ "status": "OK" });
    }

    return res.json({ "status": "ERROR" });
};

// TODO: What does this method do?
// TODO: Shouldn't this be moves to the "helpers" folder...?
const getDateWithOffset = function(days = 0, weeks = 0)
{
    let ms = 0;
    ms += (days * 24 * 60 * 60 * 1000); // Add days
    ms += (weeks * 7 * 24 * 60 * 60 * 1000); // Add weeks

    return new Date(+new Date + ms).toISOString().substring(0, 10);
};

// Sends email 2 days after user has signed up
const cronjobTwoDayNudge = async function (add) {
    console.log("[CRON] Emails 3a starting: Sending two day nudge emails");

    const bindings = [getDateWithOffset(-5), getDateWithOffset(-2)];
    const stakeholders = await bookshelf.knex.select("stakeholders.*",
        bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '3a') AS sent_emails"),
    ).from("stakeholders").whereRaw("stakeholders.isActivated = 1 AND stakeholders.created_at > ? AND stakeholders.created_at < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.twoDayNudge, stakeholder.email, { stakeholder: stakeholder, host: process.env.CRONJOB_EMAIL_HOST });
        });
    }

    return true;
};

// Sends email 14 days after user has signed up
const cronjobFourteenDayAccountReview = async function (add) {
    console.log("[CRON] Emails 3b starting: Sending fourteen day account review emails");

    const bindings = [getDateWithOffset(-3, -2), getDateWithOffset(0, -2)];
    const stakeholders = await bookshelf.knex.select("stakeholders.*",
        bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '3b') AS sent_emails"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM toc_members WHERE stakeholder_id = stakeholders.id) AS amount_of_tocs")
    ).from("stakeholders").whereRaw("stakeholders.isActivated = 1 AND stakeholders.hasUsedFreeTrial = 1 AND stakeholders.created_at > ? AND stakeholders.created_at < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0 && stakeholder.amount_of_tocs > 0;
        }).forEach(function (stakeholder) {
            add(emails.fourteenDayAccountReview, stakeholder.email, { stakeholder: stakeholder, host: process.env.CRONJOB_EMAIL_HOST });
        });
    }

    return true;
};

// Sends email when user hasn't logged in for 20 days. This email is sent only once per user
const cronjobTwentyDaysNotLoggedIn = async function (add) {
    console.log("[CRON] Emails 4a starting: Sending twenty days not logged in emails");

    const bindings = [getDateWithOffset(-61, 0), getDateWithOffset(-20, 0)];

    // 4a = 20 days, 4b = 2 months
    const stakeholders = await bookshelf.knex.select("stakeholders.*",
        bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '4a') AS sent_emails"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM toc_members WHERE stakeholder_id = stakeholders.id) AS amount_of_tocs"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM organisation_members WHERE stakeholder_id = stakeholders.id) AS amount_of_orgs")
    ).from("stakeholders").whereRaw("stakeholders.isActivated = 1 AND stakeholders.last_login_at > ? AND stakeholders.last_login_at < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.twentyDaysNotLoggedIn, stakeholder.email, { hasOrgOrToc: (stakeholder.amount_of_tocs > 0 || stakeholder.amount_of_orgs > 0 ), stakeholder: stakeholder, host: process.env.CRONJOB_EMAIL_HOST });
        });
    }

    return true;
};

// Sends email when user hasn't logged in for 2 months. This email is sent only once per user
const cronjobTwoMonthsNotLoggedIn = async function (add) {
    console.log("[CRON] Emails 4b starting: Sending two months not logged in emails");

    const bindings = [getDateWithOffset(-61, 0)];

    // 4a = 20 days, 4b = 2 months
    const stakeholders = await bookshelf.knex.select("stakeholders.*",
        bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '4b') AS sent_emails"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM toc_members WHERE stakeholder_id = stakeholders.id) AS amount_of_tocs"),
        bookshelf.knex.raw("(SELECT COUNT (*) FROM organisation_members WHERE stakeholder_id = stakeholders.id) AS amount_of_orgs")
    ).from("stakeholders").whereRaw("stakeholders.isActivated = 1 AND stakeholders.last_login_at < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.twoMonthsNotLoggedIn, stakeholder.email, { hasOrgOrToc: (stakeholder.amount_of_tocs > 0 || stakeholder.amount_of_orgs > 0 ), stakeholder: stakeholder, host: process.env.CRONJOB_EMAIL_HOST });
        });
    }

    return true;
};

// Sends email to warn that the free trial is about to expire
const cronjobTrialExpiryWarning = async function (add) {
    console.log("[CRON] Emails 5 starting: Sending trial expire warning emails");

    const bindings = [getDateWithOffset(3, 0), getDateWithOffset(5, 0)];

    const stakeholders = await bookshelf.knex.select("stakeholders.*", "organisations.plan_id", "organisations.subs_exp_date", "organisations.id AS organisation_id", "organisations.slug AS organisation_slug",
            bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '5') AS sent_emails"),
        )
        .from("stakeholders")
        .innerJoin(bookshelf.knex.raw("organisations ON (organisations.isActivated = 1 AND organisations.plan_id = 1 AND organisations.id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id AND organisation_members.isAdmin = 1))"))
        .whereRaw("stakeholders.isActivated = 1 AND organisations.subs_exp_date > ? AND organisations.subs_exp_date < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.trialExpiryWarning, stakeholder.email, {
                stakeholder: stakeholder,
                host: process.env.CRONJOB_EMAIL_HOST,
                buttonText: "UPGRADE NOW",
                buttonUrl: `${process.env.PROTOCOL}${process.env.CRONJOB_EMAIL_HOST}/plans/${stakeholder.organisation_slug}`,
                templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });
        });
    }

    return true;
};

// Sends an offer to extend the trial
const cronjobExtendTrial = async function (add) {
    console.log("[CRON] Emails 6 starting: Sending extend trial emails");

    const bindings = [getDateWithOffset(0), getDateWithOffset(-1)];

    const stakeholders = await bookshelf.knex.select("stakeholders.*", "organisations.plan_id", "organisations.subs_exp_date", "organisations.id AS organisation_id", "organisations.slug AS organisation_slug", "organisations.extend_trial AS organisation_extend_trial",
            bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '6') AS sent_emails"),
        )
        .from("stakeholders")
        .innerJoin(bookshelf.knex.raw("organisations ON (organisations.isActivated = 1 AND organisations.plan_id = 1 AND organisations.id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id AND organisation_members.isAdmin = 1))"))
        .whereRaw("stakeholders.isActivated = 1 AND (organisations.subs_exp_date = ? OR organisations.subs_exp_date = ?)", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.extendTrial, stakeholder.email, {
                stakeholder: stakeholder,
                host: process.env.CRONJOB_EMAIL_HOST,
                buttonText: "UPGRADE NOW",
                buttonUrl: `${process.env.PROTOCOL}${process.env.CRONJOB_EMAIL_HOST}/organisations/${stakeholder.organisation_slug}`,
                templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID,
                canExtend: (stakeholder.organisation_extend_trial === 0)
            });
        });
    }

    return true;
};

// Sends an offer 30 days after trial has expired
const cronjobThirtyDaysAfterTrialExpired = async function (add) {
    console.log("[CRON] Emails 7 starting: Sending 30 days after trial expired emails");

    const bindings = [getDateWithOffset(-30)];

    const stakeholders = await bookshelf.knex.select("stakeholders.*", "organisations.plan_id", "organisations.subs_exp_date", "organisations.id AS organisation_id", "organisations.slug AS organisation_slug",
            bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '7') AS sent_emails"),
            bookshelf.knex.raw("(SELECT COUNT (*) FROM organisations WHERE plan_id != 1 AND id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id)) AS non_trials_organisations"),
            bookshelf.knex.raw("(SELECT COUNT (*) FROM tocs INNER JOIN organisations ON organisations.id = tocs.organisation_id WHERE tocs.id IN (SELECT toc_members.toc_id FROM toc_members WHERE toc_members.stakeholder_id = stakeholders.id) AND organisations.plan_id != 1) AS connected_tocs")
        )
        .from("stakeholders")
        .innerJoin(bookshelf.knex.raw("organisations ON (organisations.isActivated = 1 AND organisations.plan_id = 1 AND organisations.id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id AND organisation_members.isAdmin = 1))"))
        .whereRaw("stakeholders.hasUsedFreeTrial = 1 AND stakeholders.isActivated = 1 AND organisations.subs_exp_date < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0 && stakeholder.non_trials_organisations === 0 && stakeholder.connected_tocs === 0;
        }).forEach(function (stakeholder) {
            add(emails.thirtyDaysAfterTrialExpired, stakeholder.email, {
                stakeholder: stakeholder,
                host: process.env.CRONJOB_EMAIL_HOST
            });
        });
    }

    return true;
};

// Sends warning that paid subscription is to expire in 20 days
const cronjobTwentyDaysSubscriptionWillExpire = async function (add) {
    console.log("[CRON] Emails 8a starting: Sending twenty days subscription expiration emails");

    const bindings = [getDateWithOffset(5, 0), getDateWithOffset(20, 0)];

    const stakeholders = await bookshelf.knex.select("stakeholders.*", "organisations.plan_id", "organisations.subs_exp_date", "organisations.id AS organisation_id", "organisations.slug AS organisation_slug",
            bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '8a') AS sent_emails"),
        )
        .from("stakeholders")
        .innerJoin(bookshelf.knex.raw("organisations ON (organisations.isActivated = 1 AND organisations.plan_id > 1 AND organisations.id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id AND organisation_members.isAdmin = 1))"))
        .whereRaw("stakeholders.isActivated = 1 AND organisations.subs_exp_date > ? AND organisations.subs_exp_date < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.twentyDaysSubscriptionWillExpire, stakeholder.email, {
                stakeholder: stakeholder,
                host: process.env.CRONJOB_EMAIL_HOST,
                buttonText: "RENEW NOW",
                buttonUrl: `${process.env.PROTOCOL}${process.env.CRONJOB_EMAIL_HOST}/plans/${stakeholder.organisation_slug}`,
                templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });
        });
    }

    return true;
};

// Sends warning that paid subscription is to expire in 5 days
const cronjobFiveDaysSubscriptionWillExpire = async function (add) {
    console.log("[CRON] Emails 8b starting: Sending twenty days subscription expiration emails");

    const bindings = [getDateWithOffset(0, 0), getDateWithOffset(5, 0)];

    const stakeholders = await bookshelf.knex.select("stakeholders.*", "organisations.plan_id", "organisations.subs_exp_date", "organisations.id AS organisation_id", "organisations.slug AS organisation_slug",
            bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '8b') AS sent_emails"),
        )
        .from("stakeholders")
        .innerJoin(bookshelf.knex.raw("organisations ON (organisations.isActivated = 1 AND organisations.plan_id > 1 AND organisations.id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id AND organisation_members.isAdmin = 1))"))
        .whereRaw("stakeholders.isActivated = 1 AND organisations.subs_exp_date > ? AND organisations.subs_exp_date < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.fiveDaysSubscriptionWillExpire, stakeholder.email, {
                stakeholder: stakeholder,
                host: process.env.CRONJOB_EMAIL_HOST,
                buttonText: "RENEW NOW",
                buttonUrl: `${process.env.PROTOCOL}${process.env.CRONJOB_EMAIL_HOST}/plans/${stakeholder.organisation_slug}`,
                templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });
        });
    }

    return true;
};

// Sends warning that paid subscription has expired
const cronjobSubscriptionExpired = async function (add) {
    console.log("[CRON] Emails 9 starting: Sending subscription expiration emails");

    const bindings = [getDateWithOffset(1, 0)];

    const stakeholders = await bookshelf.knex.select("stakeholders.*", "organisations.plan_id", "organisations.subs_exp_date", "organisations.id AS organisation_id", "organisations.slug AS organisation_slug",
            bookshelf.knex.raw("(SELECT COUNT (*) FROM sent_emails WHERE stakeholder_id = stakeholders.id AND email_code = '9') AS sent_emails"),
        )
        .from("stakeholders")
        .innerJoin(bookshelf.knex.raw("organisations ON (organisations.isActivated = 1 AND organisations.plan_id > 1 AND organisations.id IN (SELECT organisation_members.organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = stakeholders.id AND organisation_members.isAdmin = 1))"))
        .whereRaw("stakeholders.isActivated = 1 AND organisations.subs_exp_date < ?", bindings);

    if(stakeholders)
    {
        stakeholders.filter(function(stakeholder)
        {
            return stakeholder.sent_emails === 0;
        }).forEach(function (stakeholder) {
            add(emails.subscriptionExpired, stakeholder.email, {
                stakeholder: stakeholder,
                host: process.env.CRONJOB_EMAIL_HOST,
                buttonText: "REACTIVATE YOUR ACCOUNT NOW",
                buttonUrl: `${process.env.PROTOCOL}${process.env.CRONJOB_EMAIL_HOST}/plans/${stakeholder.organisation_slug}`,
                templateId: process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID
            });
        });
    }

    return true;
};

// TODO: What is this method for...??
const fetchFourteenDayAccountReviewData = async function(options)
{
    const bindings = [options.stakeholder.id];
    const tocs = await bookshelf.knex.select("tocs.*").from("tocs").
        whereRaw("tocs.id IN (SELECT toc_members.toc_id FROM toc_members WHERE stakeholder_id = ?)", bindings);

    const firebaseDatabase = firebase.database();

    const childNames = ["relationships", "narratives", "blocks"];
    const counters = {};

    for(childName of childNames)
    {
        counters[childName] = 0;
    }

    const tocsToFetch = [];
    for(toc of tocs)
    {
        tocsToFetch.push(toc);
    }

    let failedTocs = 0;
    let fetchedTocs = 0;
    let waitTimer = 500 * tocsToFetch.length;

    for(var i = 0; i < tocsToFetch.length; i++)
    {
        const toc = tocsToFetch[i];

        firebaseDatabase.ref(`/projects`).orderByChild("parent_project_uuid").equalTo(toc.uuid).on("child_added", function(snapshot)
        {
            tocsToFetch.push({ uuid: snapshot.key });
        });
    }

    // Timer necessary because we don't know how many child projects a toc has and there is no way to simply await the result from Firebase.
    await new Promise(resolve => setTimeout(resolve, waitTimer)); // Wait timer for child projects

    while(tocsToFetch.length > 0)
    {
        // FIFO list
        const toc = tocsToFetch.shift();
        const ref = firebaseDatabase.ref(`/projects/${toc.uuid}/data`);

        await Promise.all([
            ref.child("relationships").once("value", function(snapshot)
            {
                const counter = parseInt(snapshot.numChildren());
                counters["relationships"] += counter;
            }, function(){ /* No children found */ }),
            ref.child("narratives").once("value", function(snapshot)
            {
                const counter = parseInt(snapshot.numChildren());
                counters["narratives"] += counter;
            }, function(){ /* No children found */ }),
            ref.child("blocks").once("value", function(snapshot)
            {
                const counter = parseInt(snapshot.numChildren());
                counters["blocks"] += counter;
            }, function(){ /* No children found */ }),
        ]).then(function()
        {
            // Success
            fetchedTocs += 1;
        }).catch(function()
        {
            // Error
            failedTocs += 1;
        });
    }

    counters.tocs = tocs.length;
    options.counters = counters;

    return true;
};

// TODO: What is this method for...? Where is this method used...?
// Does this method collect all cron jobs at a moment in time to subsequently execute them?
const executeCrons = async function () {
    const crons = [
        cronjobTwoDayNudge,
        cronjobFourteenDayAccountReview,
        cronjobTwentyDaysNotLoggedIn,
        cronjobTwoMonthsNotLoggedIn,
        cronjobTrialExpiryWarning,
        cronjobExtendTrial,
        cronjobThirtyDaysAfterTrialExpired,
        cronjobTwentyDaysSubscriptionWillExpire,
        cronjobFiveDaysSubscriptionWillExpire,
        cronjobSubscriptionExpired
    ];

    return new Promise(async function (resolve, reject) {
        const queuedEmails = [];
        let queueProcessorTimeout = null;
        const queueProcessor = async function () {
            const promises = [];
            // 10 mails per 2 seconds as to not spam SendGrid
            let max = 10;
            while (max >= 0 && queuedEmails.length > 0) {
                const email = queuedEmails.shift();
                max -= 1;

                promises.push(sendEmail(email.email, email.to, email.options));
            }

            Promise.all(promises).then(function()
            {
                if (queuedEmails.length === 0) {
                    clearTimeout(queueProcessor);
                }
                else
                {
                    queueProcessorTimeout = setTimeout(queueProcessor, 2000);
                }

                return resolve();
            }).catch(function()
            {
                clearTimeout(queueProcessor);

                return reject();
            });
        };

        const pushEmail = function (email, to, options) {
            queuedEmails.push({ email, to, options });
        };

        for (var i = 0; i < crons.length; i++) {
            const cron = crons[i];
            const res = await cron(pushEmail);

            if (!res) {
                console.log(`[CRON] Sending ${cron.name} emails failed.`);
            }
        }

        await queueProcessor();
    });
};

// Helper used in other mailer methods to send an email. It saves sent emails in the SentEmail table of MySQL. It uses the send method to actually send through Sendgrid.
const sendEmail = async function (email, to, options) {
    let res = false;

    if (!options) {
        options = {};
    }

    if(!("stakeholder" in options))
    {
        return res;
    }

    switch (email) {
        case emails.uponFreeTrialCreation:
            res = await send("[Changeroo] Your Quick-Start Guide", "./views/mailings/1_uponFreeTrialCreation.pug", to, options);
            break;

        case emails.uponCreatingFreeOrganisation:
            res = await send("[Changeroo] Important Account Information", "./views/mailings/2a_uponCreatingFreeOrganisation.pug", to, options);
            break;

        case emails.uponCreatingPaidOrganisation:
            res = await send("[Changeroo] Helpful links to get started", "./views/mailings/2b_uponCreatingPaidOrganisation.pug", to, options);
            break;

        case emails.twoDayNudge:
            res = await send("Changeroo can do that?", "./views/mailings/3a_2dayNudge.pug", to, options);
            break;

        case emails.fourteenDayAccountReview:
            await fetchFourteenDayAccountReviewData(options);
            res = await send("[Changeroo] Your 15-day activity report", "./views/mailings/3b_14dayAccountReview.pug", to, options);
            break;

        case emails.twentyDaysNotLoggedIn:
            res = await send("[Changeroo] Where did you go?", "./views/mailings/4a_20dayNotLoggedIn.pug", to, options);
            break;

        case emails.twoMonthsNotLoggedIn:
            res = await send("[Changeroo] Where did you go?", "./views/mailings/4b_2monthsNotLoggedIn.pug", to, options);
            break;

        case emails.trialExpiryWarning:
            options.organisation = (await Organisation.where({ id: options.stakeholder.organisation_id }).fetch()).toJSON(),
            res = await send("[Changeroo] 5 days to go", "./views/mailings/5_trialExpiryWarning.pug", to, options);
            break;

        case emails.extendTrial:
            {
                options.organisation = (await Organisation.where({ id: options.stakeholder.organisation_id }).fetch()).toJSON();

                if(options.canExtend)
                {
                    res = await send("[Changeroo] Extend your trial by 7 days", "./views/mailings/6_extendTrial.pug", to, options);
                }
                else
                {
                    res = await send("[Changeroo] Your trial has ended", "./views/mailings/6_extendTrial.pug", to, options);
                }

                break;
            }

        case emails.thirtyDaysAfterTrialExpired:
            options.organisation = (await Organisation.where({ id: options.stakeholder.organisation_id }).fetch()).toJSON(),
            res = await send("A new way to test out Changeroo", "./views/mailings/7_30daysAfterTrialExpired.pug", to, options);
            break;

        case emails.twentyDaysSubscriptionWillExpire:
            options.organisation = (await Organisation.where({ id: options.stakeholder.organisation_id }).fetch()).toJSON(),
            res = await send(`Warning: Your subscription ends soon (${options.organisation.name})`, "./views/mailings/8a_20daysWillExpire.pug", to, options);
            break;

        case emails.fiveDaysSubscriptionWillExpire:
            options.organisation = (await Organisation.where({ id: options.stakeholder.organisation_id }).fetch()).toJSON(),
            res = await send(`Warning: Renew your subscription now! (${options.organisation.name})`, "./views/mailings/8b_5daysWillExpire.pug", to, options);
            break;

        case emails.subscriptionExpired:
            options.organisation = (await Organisation.where({ id: options.stakeholder.organisation_id }).fetch()).toJSON(),
            res = await send(`[Changeroo] Your account has been deactivated (${options.organisation.name})`, "./views/mailings/9_subscriptionExpired.pug", to, options);
            break;

        case emails.hitPlanLimit:
            res = await send(`[Changeroo] You’ve reached your account limit (${options.organisation.name})`, "./views/mailings/10_hitPlanLimit.pug", to, options);
            break;

        case emails.invoice:
            res = await send(`[Changeroo] Your subscription purchase for (${options.organisation.name})`, "./views/mailings/11_invoice.pug", to, options);
            break;
    }

    if (res) {
        await SentEmail.forge({
            stakeholder_id: options.stakeholder.id,
            organisation_id: (options.organisation) ? options.organisation.id : null,
            email_code: email,
            sent_at: new Date()
        }).save();
    }

    return res;
};

// Method that calls on Sendgrid to process the email.
const send = function (subject, template, to, options) {
    return new Promise(function (resolve, reject) {
        fs.readFile(template, 'utf8', function (err, templateContent) {
            if (err) {
                return resolve(false);
            }

            const templateBodies = templateContent.split("------------------------------------");

            let body1 = pug.render(templateBodies[0], options);
            let body2 = (templateBodies.length > 1) ? pug.render(templateBodies[1], options) : "";

            const fromMail = new helper.Email(process.env.SENDGRID_NO_REPLY_MAIL, process.env.SENDGRID_SENDER_NAME);
            const toMail = new helper.Email(to);
            const content = new helper.Content('text/html', body1);
            const mail = new helper.Mail(fromMail, subject, toMail, content);

            if(process.env.NODE_ENV !== "production" && !options.force)
            {
                const mailSettings = new helper.MailSettings();
                mailSettings.setSandBoxMode(new helper.SandBoxMode(true));
                mail.addMailSettings(mailSettings);
            }

            if(!options.templateId)
            {
                mail.setTemplateId(process.env.SENDGRID_INFORMATIONAL_TEMPLATE_ID);
            }
            else
            {
                mail.setTemplateId(options.templateId);
            }

            mail.personalizations[0].addSubstitution(new helper.Substitution(`-header-`, subject));
            mail.personalizations[0].addSubstitution(new helper.Substitution(`-body1-`, body1));

            if (body2) {
                mail.personalizations[0].addSubstitution(new helper.Substitution(`-body2-`, body2));
            }

            if (options.stakeholder) {
                mail.personalizations[0].addSubstitution(new helper.Substitution(`-stakeholdername-`, options.stakeholder.full_name));
            }
            mail.personalizations[0].addSubstitution(new helper.Substitution(`-buttonurl-`, options.buttonUrl));
            mail.personalizations[0].addSubstitution(new helper.Substitution(`-buttontext-`, options.buttonText));

            const request = sendgrid.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
            });

            sendgrid.API(request, function (err, response) {
                if (err) {
                    return resolve(false);
                }

                resolve(true);
            });
        });
    });
};

module.exports = {
    test,
    emails,
    sendEmail,
    executeCrons
};
