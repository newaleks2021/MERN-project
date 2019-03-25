
exports.up = function(knex, Promise) {
  return knex.schema.table('tocs', function(t) {
    t.integer('visibility').defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('tocs', function(t) {
        t.dropColumn('visibility');
    });
};
