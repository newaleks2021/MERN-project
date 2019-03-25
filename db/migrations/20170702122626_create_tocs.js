
exports.up = function(knex, Promise) {
    return knex.schema.createTable('tocs', (table) => {
        table.increments().primary().unsigned();
        table.string('uuid', 36).notNullable();
        table.string('name', 255);
        table.text('about', 300);
        table.string('avatar', 255);
        
        table.string('website', 255);
        table.string('facebook', 255);
        table.string('google_plus', 255);
        table.string('instagram', 255);
        table.string('linkedin', 255);
        table.string('pinterest', 255);
        table.string('twitter', 255);

        table.integer('organisation_id').unsigned().references('id').inTable('organisations').onDelete('SET NULL');

        table.boolean('isActivated').notNullable().defaultsTo(false);
        table.boolean('shouldBeDestroyed').notNullable().defaultsTo(false);

        table.dateTime('deactivated_at');
	    table.unique('uuid');

        table.timestamps();
    }); 
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('tocs');
};
