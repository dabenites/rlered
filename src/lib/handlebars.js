const { format } = require('timeago.js');

const helpers = {};

helpers.timeago = (savedTimestamp) => {
return format(savedTimestamp);
};

//helpers.registerHelper('ifEquals', function(arg1, arg2, options) {
//    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
//});

module.exports = helpers;
