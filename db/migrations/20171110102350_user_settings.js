exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_settings', (table) => {
    table.increments().primary().unsigned();
    table.integer('stakeholder_id').unsigned().references('id').inTable('stakeholders').onDelete('CASCADE');
    table.string('key');
    table.json('value');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('user_settings');
};