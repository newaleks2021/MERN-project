exports.up = async (knex, Promise) => {
    await knex.schema.table('support_organisations', function(t) {
        t.integer('sort_order').defaultTo(0);
    });

    await knex.raw("SET @i:=0;");
    
    return knex.raw('UPDATE support_organisations SET sort_order = @i:=@i+1 ORDER BY id');
};

exports.down = function(knex, Promise) {
    return knex.schema.table('support_organisations', (table) => {
        table.dropColumn('sort_order');
    });
};
