const slug = require('slug');

exports.up = function(knex, Promise) {
  
  return Promise.resolve()
    .then(function(){
      return knex.schema.table('organisations', (table) => {
        table.string('slug', 100).notNullable();    
      });
    }).then(function(return_value){
      knex.select(['id','name']).from('organisations').then((organisations) => {
        
        organisations.forEach(function(org){
          knex('organisations')
          .where('id', '=', org.id)
          .update({
            slug: slug(org.name, {lower: true})
          }).catch(function(error){
            console.log(error)
          }).then(function(){
            console.log('  • Added slug to organisation: ' + org.id + ' - ' + org.name);
          })
        })
      })
            
      return return_value;
    })

  
  
};

exports.down = function(knex, Promise) {
  return knex.schema.table('organisations', (table) => {
    table.dropColumn('slug');
  });
};
