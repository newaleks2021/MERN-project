const express = require('express');
const path = require('path');
const expressSanitizer = require('express-sanitizer');
const bodyParser = require('body-parser');

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const favicon = require('serve-favicon');
const i18n = require('i18n');
const csrf = require('csurf');
const {router, api} = require('./routes');
const format = require('date-fns/format');

const flashMiddleware = require('./middleware/flashMiddleware');
const localsMiddleware = require('./middleware/localsMiddleware');
const {devErrors, prodErrors, csrfErrors} = require('./middleware/errorMiddleware');

const {queryParameterHandler} = require('./helpers/urlHelper');
const app = express();

i18n.configure({
  locales: [
    'en', 'nl'
  ],
  register: global,
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  objectNotation: true,
  updateFiles: false
});

// Define view engine and static assets
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Define global middleware for our server
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts({maxAge: 7776000000}));
app.use(helmet.frameguard('SAMEORIGIN'));
app.use(helmet.xssFilter({setOnOldIE: true}));
app.use(helmet.noSniff());

// Session setup
var sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
let sessionSettings = {
  secret: process.env.SESSION_SECRET,
  key: process.env.SESSION_KEY,
  store: sessionStore,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    //domain: process.env.COOKIE_DOMAIN
  }
};

app.use(session(sessionSettings));



app.use(cookieParser(process.env.COOKIE_SECRET, {
  httpOnly: true,
  maxAge: process.env.COOKIE_MAX_AGE
}));

app.use(bodyParser.json({limit: '50mb'}));
//app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
app.use(expressSanitizer({}));

app.use(flash());
app.use(localsMiddleware);
app.use(flashMiddleware);

app.use(i18n.init);
app.use(favicon(__dirname + '/public/img/favicon.ico'));

// Populate locals
app.use((req, res, next) => {
  req.setLocale('en');
  res.locals.user = req.session.user || null;
  res.locals.formatFormDate = (data) => {
    if(data)
    {
      return format(data, process.env.DATE_FORM_FORMAT);
    }

    return null;
  },
  res.locals.formatDate = (data) => {
    if(data)
    {
      return "<time format='" + process.env.DATE_FORMAT + "' datetime='" + data.toUTCString() + "'>" + format(data, process.env.DATE_FORMAT) + "</time>";
    }

    return "";
  };

  res.locals.queryParam = queryParameterHandler;

  return next();
});

// Sanitize request body if it has values
app.use((req, res, next) => {
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) 
    return next();
  
  const requestBody = Object.assign({}, JSON.parse(JSON.stringify(req.body)));

  for (const prop in requestBody) {
    if (requestBody.hasOwnProperty(prop)) {
      req.body[prop] = req.sanitize(req.body[prop]);
    }
  }

  return next();
});

app.use('/api', api);

app.use(csrf({cookie: false}));
app.use((req, res, next) => {
  if (!req.session.user) 
    res.locals.user = null;
  
  res.locals.csrfToken = req.csrfToken();
  res.locals.csrfToken2 = req.csrfToken();
  next();
});
app.use(csrfErrors);

// Development & production error handling
if (app.get('env') === 'development') {
  app.use(devErrors);
}
app.use(prodErrors);
app.use('/', router);

module.exports = app;
