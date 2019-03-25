const bookshelf = require('../db');
const fs = require('fs');
const PDF = require('pdfkit');
const Organisation = require('../models/organisation');
const Transaction = require('../models/transaction');
const Plan = require('../models/plan');
const Coupon = require('../models/coupon');
const { formatMoney } = require('./paymentController');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Generates an invoice (pdf) for a transaction
 */
const generatePdf = async (req, res) => {
    const organisation = await Organisation.where({slug: req.params.slug}).fetch();
    const plan = await Plan.where({id: organisation.get("plan_id")}).fetch();
    const transactionId = req.params.id.slice(0, parseInt(req.params.divider));
    const transaction = await Transaction.where({id: transactionId}).fetch();

    if(!transaction)
    {
        return res.redirect(`back`);
    }

    const couponId = transaction.get("coupon_id");
    let coupon = null;

    if(couponId)
    {
        coupon = await Coupon.where({id: transaction.get("coupon_id")}).fetch();
    }

    const doc = new PDF({
        size: [595.28, 841.89], // A4
        margins : { // by default, all are 72
            top: 72, 
            bottom: 72,
            left: 72,
            right: 72
        },
        layout: 'portrait',
        info: {
            Title: 'Changeroo Invoice',
            Author: 'Changeroo',
            Keywords: 'changeroo;invoice'
        }
    });
 
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.image('public/img/invoice/changeroo-logo.png', 370.28, 40, { width: 180 });
    doc.image('public/img/invoice/business-for-development.png', 40, 30, { width: 140 });

    const drawLine = (function(x, y, width, height, lineWidth = 0.2)
    {
        this.moveTo(x, y)
        .lineTo(x + width, y + height)
        .lineWidth(lineWidth)
        .stroke();
    }).bind(doc);

    const drawBox = (function(x, y, width, height, lineWidth = 0.2, fillColor="white", strokeColor="black")
    {
        this.moveTo(x, y)
        .lineTo(x + width, y)
        .lineTo(x + width, y + height)
        .lineTo(x, y + height)
        .lineTo(x, y)
        .lineWidth(lineWidth)
        .fillAndStroke(fillColor, strokeColor);
    }).bind(doc);

    const drawText = (function(lines, fontColor, fontSize, x, y, width, bold=false, textAlign="left", lineSpacing=4)
    {
        if(bold)
        {
            this.font('Helvetica-Bold');
        }
        else
        {
            this.font('Helvetica');
        }

        this.fillColor(fontColor);

        let currentY = y;
        for(var i = 0; i < lines.length; i++)
        {
            const line = lines[i];

            if(line)
            {
                this.fontSize(fontSize).text(line, x, currentY, { width: width, align: textAlign });

                currentY += (fontSize + lineSpacing);
            }
        }
    }).bind(doc);

    drawBox(30, 120, 535.28, 68);
    drawLine(282.64, 120, 0, 68);

    drawText([
        "Business For Development B.V.", 
        "St. Jorisplein 111",
        "2981 GJ Ridderkerk",
        "The Netherlands"
    ], "black", 9, 40, 130, 252.64);

    drawText([
        "https://changeroo.com", 
        "Chamber of Commerce Rotterdam 24432867",
        "VAT Number: NL8191.93.434.B01"
    ], "black", 9, 292.64, 143, 262.64, false, "right");

    const factuurNr = transaction.get("id").toString() + transaction.get("paylane_id").toString();

    drawText([`Invoice ID: ${factuurNr}`], "black", 11, 40, 208, 401.25, false, "left");

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    const date = transaction.get("created_at");
    var formattedDate = months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

    drawText([formattedDate], "black", 11, 30, 238, 535.28, false, "center");
    drawText([organisation.get("name")], "black", 11, 30, 288, 535.28, true, "center");
    drawText([
        organisation.get("address"), 
        organisation.get("country"),
        organisation.get("isValidVatNumber") ? `Your VAT number: ${organisation.get("vat_number")}` : null
    ], "black", 11, 30, 307, 535.28, false, "center", 8);
    
    drawBox(30, 394, 535.28, 19, 1, "#606060", "#606060");
    drawText(["Description"], "white", 11, 40, 399, 401.25, true, "center");
    drawText(["Amount"], "white", 11, 468, 399, 67.28, true, "center");

    if(coupon)
    {
        const amount_ex_vat = transaction.get("amount_ex_vat");

        let couponAmount = coupon.get("discount_amount");
        let couponPercentage = 1;
        if(coupon.get("discount_percentage") > 0)
        {
            couponPercentage = 1.0 / ((100.0 - coupon.get("discount_percentage")) / 100.0);
        }

        const plan_price = (amount_ex_vat * couponPercentage) + couponAmount;
        const totalCoupon = plan_price - amount_ex_vat;

        drawText([
            `Changeroo license: ${plan.get("name")}`,
            `Discount (${coupon.get("code")})`
        ], "black", 11, 40, 429, 401.25, false, "left", 12);

        drawText([
            `€ ${formatMoney(plan_price, 2)}`,
            `- € ${formatMoney(totalCoupon, 2)}`
        ], "black", 11, 468, 429, 67.28, false, "right", 12);
    }
    else
    {
        drawText([`Changeroo license: ${plan.get("name")}`], "black", 11, 40, 429, 401.25, false, "left");
        drawText([`€ ${formatMoney(transaction.get("amount_ex_vat"), 2)}`], "black", 11, 468, 429, 67.28, false, "right");
    }

    drawText([
        "Total amount in euro’s (€) excluding VAT:",
        `VAT (${transaction.get("vat_percentage")}%):`,
        "Total amount in euro’s (€) including VAT:"
    ], "black", 11, 40, 491, 401.25, false, "right", 12);

    drawText([
        `€ ${formatMoney(transaction.get("amount_ex_vat"), 2)}`,
        `€ ${formatMoney((transaction.get("amount_inc_vat") - transaction.get("amount_ex_vat")), 2)}`,
        `€ ${formatMoney(transaction.get("amount_inc_vat"), 2)}`
    ], "black", 11, 468, 491, 67.28, false, "right", 12);

    drawLine(479, 531, 67.28, 0);

    doc.end();
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Renders all transactions for super admin
 */
const index = async (req, res) => {
    // When there are multiple query parameters of the same type
    if(typeof req.query.search == 'object') {
        req.query.search = Array.from(req.query.search)[1];
    }

    if(typeof req.query.sortBy == 'object') {
        req.query.sortBy = Array.from(req.query.sortBy)[1];
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
        Transaction.searchables.map((searchable, i) => {
            if(i == 0)
            {
                search += `${searchable} LIKE ?`;
            }
            else
            {
                search += ` OR ${searchable} LIKE ?`;
            }

            bindings.push(`%${req.query.search}%`);
        });
    }

    if(search !== "")
    {
        raw += "(" + search + ")";
    }

    let transactionsCount = await bookshelf.knex("transactions").innerJoin("plans", function()
    {
        this.on("plans.id", "=", "transactions.plan_id");  
    }).innerJoin("organisations", function()
    {
        this.on("organisations.id", "=", "transactions.organisation_id");  
    }).innerJoin("stakeholders", function()
    {
        this.on("stakeholders.id", "=", "transactions.stakeholder_id");  
    }).leftOuterJoin("coupons", function()
    {
        this.on("coupons.id", "=", "transactions.coupon_id");  
    }).whereRaw(raw, bindings).count("transactions.id as count");

    let transactionsQuery = bookshelf.knex.select("transactions.*", "plans.name AS plan_name", "organisations.name AS organisation_name", "organisations.slug AS organisation_slug", "stakeholders.username AS stakeholder_username", "coupons.code AS coupon_code").from("transactions").innerJoin("plans", function()
    {
        this.on("plans.id", "=", "transactions.plan_id");  
    }).innerJoin("organisations", function()
    {
        this.on("organisations.id", "=", "transactions.organisation_id");  
    }).innerJoin("stakeholders", function()
    {
        this.on("stakeholders.id", "=", "transactions.stakeholder_id");  
    }).leftOuterJoin("coupons", function()
    {
        this.on("coupons.id", "=", "transactions.coupon_id");  
    }).whereRaw(raw, bindings);

    if(req.query.sortBy)
    {
        transactionsQuery.orderBy(req.query.sortBy, (req.query.sortOrder ? req.query.sortOrder : "ASC"));
    }
    else
    {
        transactionsQuery.orderBy("transactions.created_at", "DESC");
    }

    transactionsQuery.limit(pagination.pageSize).offset(pagination.pageSize * (pagination.page - 1));

    const transactions = await transactionsQuery;

    pagination.rowCount = transactionsCount[0].count;
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
        urlParts.push(`sortBy=${req.query.sortBy}`);
    }

    if(req.query.sortOrder)
    {
        urlParts.push(`sortOrder=${req.query.sortOrder}`);
    }

    const url = "?" + (urlParts.length > 0 ? (urlParts.join("&") + "&") : "");
    
    res.render('transactions/index', {
        title: __('views.page-titles.transactions-index'), 
        transactions,
        pagination: pagination,
        currentSort: req.query.sortBy ? req.query.sortBy : '',
        sortOrder: req.query.sortOrder ? req.query.sortOrder : 'ASC',
        reverseSortOrder: req.query.sortOrder === "ASC" ? "DESC" : "ASC",
        url,
        baseUrl
    });
};

module.exports = {
    index,
    generatePdf
};
