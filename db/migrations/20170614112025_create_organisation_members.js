
exports.up = function(knex, Promise) {
    return knex.schema.createTable('organisation_members', (table) => {
        table.increments().primary().unsigned();

        table.boolean('isAdmin').defaultsTo(false);
        table.integer('stakeholder_id').unsigned().references('id').inTable('stakeholders').onDelete('CASCADE');
        table.integer('organisation_id').unsigned().references('id').inTable('organisations').onDelete('CASCADE');

        table.string('admin_activation_hash', 255);
        table.dateTime('admin_activation_sent_at');

        table.string('member_activation_hash', 255);
        table.dateTime('member_activation_sent_at');

        table.timestamps();
    }); 
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('organisation_members');
};
