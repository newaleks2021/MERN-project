const devErrors = (err, req, res, next) => {
  err.stack = err.stack || '';
  const errorDetails = {
    message: err.message,
    status: err.status,
    stackHighlighted: err.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>')
  };
  res.status(err.status || 500);
  res.format({
    // Based on the `Accept` http header
    'text/html': () => {
      res.render('error', errorDetails);
    }, // Form Submit, Reload the page
    'application/json': () => res.json(errorDetails) // Ajax call, send JSON back
  });
};

const prodErrors = (err, req, res, next) => {
  res.status(err.status || 500);
  req.flash('error', err.message);
  return res.redirect('/');
};

/**
 * @public
 * Wraps async route functions to catch errors
 * @param {Function} [fn] 
 */
const catchErrors = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/**
 * @public
 * Catches bad form errors
 */
const csrfErrors = (err, req, res, next) => {
  if(err.code !== 'EBADCSRFTOKEN') return next(err);
  req.flash('error', req.__('flashes.form-reload'));
  res.redirect('back');
};

module.exports = {devErrors, prodErrors, catchErrors, csrfErrors};