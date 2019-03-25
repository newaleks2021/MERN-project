
exports.up = function(knex, Promise) {
    return knex.schema.table('coupons', (table) => {
        table.integer('valid_for').defaultTo(0);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('coupons', (table) => {
        table.dropColumn('valid_for');
    });
};
