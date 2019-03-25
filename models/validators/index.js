const validate = require('validate.js');

exports.lowercase = validate.validators.lowercase = (value, options, key, attributes) => value && value == value.toLowerCase()
  ? null
  : options.message;

exports.social = validate.validators.social = (value, options, key, attributes) => {
  if (!value || !value.length > 0) {
    return null;
  }
  if (value.includes(options.platform)) 
    return null;
  return options.message;
};

exports.validProtocol = validate.validators.validProtocol = (value, options, key, attributes) => {
  if (!value || !value.length > 0) {
    return null;
  }
  if (value.includes('http') || value.includes('https')) 
    return null;
  return __('models.protocol.missing');
};