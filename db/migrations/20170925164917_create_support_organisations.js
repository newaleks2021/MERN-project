
exports.up = function(knex, Promise) {
    return knex.schema.createTable('support_organisations', (table) => {
        table.increments().primary().unsigned();
        table.string('name', 50).notNullable();
        table.string('logo', 255);
        table.text('description', 600);
        table.string('link', 355);
        table.text('specialisation_tags', 600);
        table.text('countries', 600);

        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('support_organisations');
};
