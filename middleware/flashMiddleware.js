const flashMiddleware = (req, res, next) => {
    res.locals.flashes = req.flash();
    
    next();
};
  
module.exports = flashMiddleware;