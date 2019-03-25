const bookshelf = require('../db');

const Coupon = bookshelf.Model.extend({
    idAttribute: 'id',
    tableName: 'coupons',
    hasTimestamps: [
        'created_at'
    ]
});

Coupon.searchables = [
    'coupons.code', 
    'coupons.description', 
    'coupons.discount_amount',
    'coupons.discount_percentage',
    'coupons.extension_days'
];

module.exports = bookshelf.model('Coupon', Coupon);