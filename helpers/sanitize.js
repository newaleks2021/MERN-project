const xss = require('xss');

const sanitize = (data) => {
    for (const prop in data) {
        data[prop] = xss(data[prop]);
    }
    return data;
};
module.exports = sanitize;