const getRandomInt = (min, max) => Math.floor(Math.random() * ((max-1) - (min+1) + 1) + (min+1));

module.exports = getRandomInt;