/**
 * @public
 * @param {Int} status
 * @param {String} message 
 * @returns Callback
 */
const throwAPIError = (status, message) => ({status, message});

module.exports = throwAPIError;