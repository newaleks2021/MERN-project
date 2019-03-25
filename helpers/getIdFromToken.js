const jwt = require('jsonwebtoken');

/**
 * @private
 * @param {*} token 
 */
const getIdFromToken = async (token) => {
    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.JWT_SECRET);
    } catch(e) { return }

    return decoded.id;
};

module.exports = getIdFromToken;
