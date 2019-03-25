exports.up = function(knex, Promise) {
    return knex.schema.createTable('coupons', (table) => {
        table.increments().primary().unsigned();

        table.string('code').notNullable();
        table.string('description');
        table.decimal('discount_amount', 10, 2);
        table.decimal('discount_percentage', 10, 2);
        table.integer('extension_days');
        table.integer('plan_id').unsigned().references('id').inTable('plans').onDelete('SET NULL');
        table.integer('max_use');
        table.date('exp_date');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('coupons');
};
