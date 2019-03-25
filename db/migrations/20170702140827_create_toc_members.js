
exports.up = function(knex, Promise) {
    return knex.schema.createTable('toc_members', (table) => {
        table.increments().primary().unsigned();

        table.integer('stakeholder_id').unsigned().references('id').inTable('stakeholders').onDelete('CASCADE');
        table.integer('toc_id').unsigned().references('id').inTable('tocs').onDelete('CASCADE');

        table.boolean('isAdmin').defaultsTo(false);
        table.boolean('isMember').defaultsTo(false);
        table.boolean('isModerator').defaultsTo(false);

        table.string('admin_activation_hash', 255);
        table.dateTime('admin_activation_sent_at');
        table.string('member_activation_hash', 255);
        table.dateTime('member_activation_sent_at');
        table.string('moderator_activation_hash', 255);
        table.dateTime('moderator_activation_sent_at');

        table.timestamps();
    }); 
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('toc_members');
};
