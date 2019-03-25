
exports.up = function(knex, Promise) {
  return knex.schema.table('tocs', function(t) {
    t.bool('needs_to_sync').defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('tocs', function(t) {
        t.dropColumn('needs_to_sync');
    });
};
