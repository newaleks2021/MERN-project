
exports.up = function(knex, Promise) {
    return knex.schema.createTable('transactions', (table) => {
        table.increments().primary().unsigned();

        table.integer('plan_id').unsigned().references('id').inTable('plans').onDelete('SET NULL');
        table.integer('stakeholder_id').unsigned().references('id').inTable('stakeholders').onDelete('SET NULL');
        table.integer('organisation_id').unsigned().references('id').inTable('organisations').onDelete('SET NULL');
        table.integer('coupon_id').unsigned().references('id').inTable('coupons').onDelete('SET NULL');
        table.integer('paylane_id').unsigned();
        table.decimal('amount_ex_vat', 10, 2);
        table.decimal('amount_inc_vat', 10, 2);
        table.decimal('vat_percentage', 10, 2);
        table.string('status');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transactions');
};
