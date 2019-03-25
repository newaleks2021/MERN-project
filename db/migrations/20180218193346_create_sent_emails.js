
exports.up = function(knex, Promise) {
    return knex.schema.createTable('sent_emails', (table) => {
        table.increments().primary().unsigned();

        table.integer('stakeholder_id').unsigned().references('id').inTable('stakeholders').onDelete('CASCADE');
        table.string('email_code',8);
        table.dateTime('sent_at');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('sent_emails');
};
