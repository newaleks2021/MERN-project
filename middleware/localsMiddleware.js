const localsMiddleware = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  next();
};

module.exports = localsMiddleware;