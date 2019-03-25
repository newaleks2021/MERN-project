exports.up = (knex, Promise) => {
  return knex.schema.createTable('stakeholders', (table) => {
    table.increments().primary().unsigned();
    table.string('email', 255).notNullable();
    table.string('full_name', 50).notNullable();
    table.string('username', 15).notNullable();

    table.string('function', 70);
    table.text('bio', 600);
    table.text('expertise', 600);
    table.string('avatar', 255);
    table.string('organisation', 255);
    table.string('phone', 40);
    table.string('location', 255);

    table.string('website', 255);
    table.string('facebook', 255);
    table.string('google_plus', 255);
    table.string('instagram', 255);
    table.string('linkedin', 255);
    table.string('pinterest', 255);
    table.string('twitter', 255);

    table.boolean('isAdmin').notNullable().defaultsTo(false);
    table.boolean('isVerified').notNullable().defaultsTo(false);
    table.boolean('isActivated').notNullable().defaultsTo(false);

    table.boolean('hasUsedFreeTrial').notNullable().defaultsTo(false);

    table.string('password_hash', 255).notNullable();
    table.string('activation_hash', 255);
    table.dateTime('activation_sent_at');
    table.dateTime('activated_at');
    table.dateTime('deactivated_at');
    table.string('reset_hash', 255);
    table.dateTime('reset_sent_at');
    table.string('new_email', 255);
    table.integer('login_count').unsigned();
    table.dateTime('last_login_at');
    table.dateTime('custom_updated_at');

    table.timestamps();
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('stakeholders');
};
