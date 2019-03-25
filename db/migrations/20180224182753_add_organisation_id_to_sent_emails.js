exports.up = function(knex, Promise) {
    return knex.schema.table('sent_emails', (table) => {
        table.integer('organisation_id').unsigned().references('id').inTable('organisations').onDelete('CASCADE').defaultsTo(null);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('sent_emails', (table) => {
        table.dropColumn('organisation_id');
    });
};
