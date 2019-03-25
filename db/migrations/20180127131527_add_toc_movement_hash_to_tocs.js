
exports.up = function(knex, Promise) {
    return knex.schema.table('tocs', function(table) {
      table.string('movement_username', 15);
      table.string('movement_hash', 255);
      table.dateTime('movement_sent_at');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('tocs', (table) => {
      table.dropColumn('movement_username');
      table.dropColumn('movement_hash');
      table.dropColumn('movement_sent_at');
    });
};
