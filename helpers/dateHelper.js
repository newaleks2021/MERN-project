
const formatDate = require('date-fns/format');

/**
 * @public
 * Creates new string to get the date right now
 * @returns {String} Date right now
 */
const newDateNow = () => {
	const date = new Date();
	return formatDate(date, process.env.DATE_FORMAT);
};

const newDateYesterday = () => {
	let date = new Date();
	date.setDate(date.getDate() - 1);

	return formatDate(date, process.env.DATE_FORMAT);
};

module.exports = { newDateNow, newDateYesterday };
