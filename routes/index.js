const express = require('express');
const path = require('path');

const webController = require('../controllers/webController');
const tocAcademyController = require('../controllers/tocAcademyController');
const APIController = require('../controllers/APIController');

const v2Controllers = require('../controllers/v2Controllers');
const v2Middleware = require('../middleware/v2Middleware');


const {
  ensureSystemAdmin,
  ensureSessionUserOrSystemAdmin,
  ensureActivatedUserOrSystemAdmin,
  ensureLoggedoutUserOrSystemAdmin,
  ensureOrganisationMemberOrSystemAdmin,
  ensureOrganisationAdminOrSystemAdmin,
  ensureOrganisationAdmin,
  ensureActivatedOrganisationOrSystemAdmin,
  ensureInvitedAsOrganisationAdmin,
  ensureInvitedAsTocRole,
  ensureValidPlanOrSystemAdmin,
  ensureTocAdminOrSystemAdmin,
  ensureIsActiveTocOrAdminRole,
  ensureHasRoleInTocOrOrganisationAdmin,
  ensureEditTocRoleRights
} = require('../middleware/ensureMiddleware');

const {catchErrors} = require('../middleware/errorMiddleware');

const {
  ensureAPILoggedIn
} = require('../middleware/authMiddleware');

const {
  filterFile,
  resizeAndWriteFile
} = require('../middleware/uploadMiddleware');

const {
  warnOrgForPlanPeriod,
  warnTocForPlanPeriod
} = require('../middleware/warnForPlanPeriodMiddleware');

const {
  warnTocForAffiliateProgram
} = require('../middleware/warnTocForAffiliateProgram');

const {readTocAcademyPosts,recacheTocAcademyPosts} = require('../middleware/cacheMiddleware');

const router = express.Router();


// router.get('/', function(req, res) {
//   res.status(200);
//   res.sendFile(path.join(__dirname, '../client/index.html'));
// })

/** ----- API ----- **/
function createApiRouter () {

  const router = new express.Router();

  // router.use(cors());
  // Give manual CORS settings.
  router.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Set-Cookie, *");
    res.header("Access-Control-Allow-Origin", "*");

    if (req.header("origin") && req.header("origin") !== "[Object object]") {
      res.header("Access-Control-Allow-Origin", req.header("origin"));
    }

    next();
  });


    
  /* New Client */
  router.get('/v2/signin', v2Middleware.refreshToken, v2Controllers.load);
  router.get('/v2/signout', v2Middleware.signout, v2Controllers.signout);
  router.get('/v2/posts', v2Controllers.posts);
  router.get('/v2/send_stakeholder_reset_password', v2Middleware.signout, v2Controllers.send_stakeholder_reset_password);
  router.get('/v2/reset_stakeholder_password', v2Middleware.signout, v2Controllers.reset_stakeholder_password);
  router.get('/v2/register_stakeholder', v2Middleware.signout, v2Controllers.register_stakeholder);
  router.get('/v2/signin/:email/:password/:remember', v2Middleware.signin, v2Controllers.load);
  router.get('/v2/toc-academy', readTocAcademyPosts, v2Controllers.load_toc_academy);
  router.get('/v2/recache-toc-academy', recacheTocAcademyPosts);
  
  Object.keys(v2Controllers).map(key => {
    if(key === 'signout' || key === 'posts') return;
    router.post(`/v2/${key}`, v2Middleware.refreshToken, v2Controllers[key]);
  });
  /* End New Client */

  router.post('/auth/check-session', APIController.checkSession);
  router.post('/auth/login', catchErrors(APIController.login));
  router.post('/auth/logout', ensureAPILoggedIn, APIController.logout);
  router.post('/upload', ensureAPILoggedIn,
    filterFile, catchErrors(resizeAndWriteFile),
    catchErrors(APIController.upload));

  /* ToC routes */
  router.post('/add-nested-toc',
    ensureAPILoggedIn,
    APIController.addNestedToc
  );
  router.post('/delete-nested-tocs-from-block',
    ensureAPILoggedIn,
    APIController.deleteNestedTocsFromBlock
  );
  router.post('/delete-nested-toc',
    ensureAPILoggedIn,
    APIController.deleteNestedToc
  );
  router.post('/export-toc',
    ensureAPILoggedIn,
    APIController.exportToc
  );
  router.post('/export-toc-diagram',
    ensureAPILoggedIn,
    APIController.exportTocDiagram
  );

  router.get('/posts/:id/json',
    ensureAPILoggedIn,
    tocAcademyController.showJsonPost
  );

  // User data routes
  router.post('/user/setting',ensureAPILoggedIn,APIController.setUserSetting);
  router.get('/user/organisations',ensureAPILoggedIn,APIController.getUserOrganisations);

  // Organisations routes
  router.get('/organisation/:slug/tocs',ensureAPILoggedIn,APIController.getOrganisationTocs);

  router.get('/toc-academy/posts/:id/json', readTocAcademyPosts, tocAcademyController.showJsonPost);
  return router;
}

const api = createApiRouter();

// 404
// @TODO redirect to the react frontend 404 page
router.use(function(req, res) {
  res.status(200);
  res.sendFile(path.join(__dirname, '../client/index.html'));
});


module.exports = {router, api};
