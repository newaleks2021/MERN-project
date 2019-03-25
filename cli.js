const program = require('commander');
const inquirer = require('inquirer');
const colors = require('colors');

/* Portal imports */
const bookshelf = require('./db');
const Toc = require('./models/toc');
const TocMember = require('./models/tocMember');
const Organisation = require('./models/organisation');
const Stakeholder = require('./models/stakeholder');
const mailController = require('./controllers/mailController');
const tocController = require('./controllers/tocController');
const {cacheTocAcademyPosts} = require('./middleware/cacheMiddleware');

program.version('0.0.2').description('Changeroo Portal CLI');

program.command('sync-all-projects-to-firebase').alias('spf').description('Sync all projects in DB to firebase. This includes users and their permissions.').action(() => {
  inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      "message": "Are you sure you want to update all projects?"
    }
  ]).then(async function(result) {
    if (result.confirm === true) {
      console.log("Synchronising projects...");

      await Toc.fetchAll().then(async function(response) {
        let promises = [];

        await response.forEach(async function(item) {
          console.log("Starting: " + colors.yellow(item.get('name')));
          promises.push(item.syncToFirebase().then(function() {
            console.log("Completed: " + colors.yellow(item.get('name')));
          }));
        });

        Promise.all(promises).then(function() {
          console.log(colors.green("Finished synchronising " + promises.length + " tocs"));
          process.exit(0);
        });
      });
    } else {
      process.exit(0);
    }
  });

});

program.command('sync-administrators-to-firebase').alias('saf').description('Sync all system administrators to firebase').action(() => {
  inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      "message": "Are you sure you want to sync all administrators?"
    }
  ]).then(async function(result) {
    if (result.confirm === true) {
      // Only fetch first stakeholder, since one sync does all admins
      let admin_stakeholders = Stakeholder.where({isAdmin: 1}).fetch().then(function(response) {
        let promises = [];

        promises.push(response.syncAdminsToFirebase());

        Promise.all(promises).then(function() {
          console.log(colors.green("[CRON] Completed synchronising administrators"));
          console.log(colors.green("[CRON] Exiting"));
          process.exit(0);
        });
      });
    } else {
      process.exit(0);
    }
  });
});

program.command('sync-marked-tocs').alias('smp').description('Sync all tocs marked for firebase sync').action(async function() {
  await Toc.where('needs_to_sync', 1).fetchAll().then(async function(response) {
    let promises = [];

    await response.forEach(async function(item) {
      console.log("[CRON] Starting: " + colors.yellow(item.get('name')));
      promises.push(item.syncToFirebase().then(function() {
        console.log("[CRON] Completed: " + colors.yellow(item.get('name')));
        item.set('needs_to_sync', 0).save();
      }));
    });

    Promise.all(promises).then(function() {
      console.log(colors.green("[CRON] Finished synchronising " + promises.length + " tocs"));
      console.log(colors.green("[CRON] Exiting"));
      process.exit(0);
    });
  });
});

program.command('send-emails').alias('se').description('Send all planned emails').action(async function() {
  mailController.executeCrons().then(function() {
    console.log(colors.green("[CRON] Sending emails succeeded."));

    process.exit(0);
  }).catch(function() {
    console.log(colors.red(`[CRON] Sending emails failed.`));

    process.exit(0);
  });
});

program.command('cache-academy').alias('ca').description('Cache ToC academy posts to mysql').action(async function() {
  await cacheTocAcademyPosts();

  process.exit(0);
});

program.command('affiliate-program').alias('ap').description('Update partner program ToCs in the database and Firebase').action(async function() {
  await tocController.affiliateProgramUpdate();

  process.exit(0);
});

program.parse(process.argv);
