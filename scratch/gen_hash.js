const bcrypt = require("bcrypt-ts");
const password = "matakokmerem";
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(hash);
