
exports.up = function(knex, Promise) {
    return knex.schema.createTable('plans', (table) => {
        table.increments().primary().unsigned();
        table.string('name', 100).notNullable();
        table.decimal('price', 19, 4).notNullable();
        table.string('currency', 11).notNullable();
        table.integer('max_tocs', 4).unsigned();
        table.integer('period', 6).unsigned();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('plans');
};
