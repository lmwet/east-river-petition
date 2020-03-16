const bcrypt = require("bcryptjs"); //already installed
const { promisify } = require("util"); //core module destructurized promisify function

const hash = promisify(bcrypt.hash);
const genSalt = promisify(bcrypt.genSalt);

exports.hash = password => genSalt().then(salt => hash(password, salt));

exports.compare = promisify(bcrypt.compare);
