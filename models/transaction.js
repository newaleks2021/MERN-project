const bookshelf = require('../db');

const Transaction = bookshelf.Model.extend({
    idAttribute: 'id',
    tableName: 'transactions',
    hasTimestamps: [
        'created_at'
    ]
});

Transaction.searchables = [
    'plans.name', 
    'transactions.paylane_id', 
    'transactions.status',
    'transactions.id',
    'organisations.name',
    'stakeholders.full_name',
    'coupons.code'
];

module.exports = bookshelf.model('Transaction', Transaction);