exports.up = function(knex, Promise) {
  return knex.schema.table('organisations', (table) => {
    table.boolean('extend_trial').notNullable().defaultsTo(false);   
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('organisations', (table) => {
    table.dropColumn('extend_trial');
  });
};
