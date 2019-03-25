exports.up = function(knex, Promise) {
    return knex.schema.createTable('wordpress_posts', (table) => {
        table.increments().primary().unsigned();
        table.integer('wp_id').unsigned();
        table.specificType('json','LONGBLOB');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('wordpress_posts');
};
