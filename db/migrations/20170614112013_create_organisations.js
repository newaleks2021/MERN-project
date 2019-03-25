
exports.up = function(knex, Promise) {
    return knex.schema.createTable('organisations', (table) => {
        table.increments().primary().unsigned();
        table.string('name', 50).notNullable();
        table.string('address', 100);
        table.string('country', 100);
        table.string('website', 255);
        table.string('avatar', 255);
        
        table.string('vat_number', 30);
        table.boolean('hasVatNumber').defaultsTo(false);
        table.boolean('isValidVatNumber').defaultsTo(false);

        table.integer('plan_id').unsigned().references('id').inTable('plans').onDelete('SET NULL');
        table.date('subs_exp_date');        
        table.boolean('isActivated').notNullable().defaultsTo(false);
        table.dateTime('activated_at');
        table.dateTime('deactivated_at');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('organisations');
};
