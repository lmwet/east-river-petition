const spicedPg = require("spiced-pg");
const db = spicedPg(
    "postgres:postgres:postgres:@localhost@localhost:5432/petition"
);

module.exports.addSigner = (first, last, signature) => {
    const q = `
    INSERT into signatures (first, last, signature)
    VALUES ($1, $2, $3)
    `;
    const params = [first, last, signature];
    return db.query(q, params);
};

module.exports.getSignature = () => {
    const q = `SELECT * FROM signatures`;
    return db.query(q);
};

//db query to get the id of the signer
// exports.sign = function(firstname, lastname, signature) {
//     returm db.query(
//         `INSERT INTO signatures (firstname, lastname, signature)
//         RETURNING id`,
//         [firstname, lastname, signature]
//     )
// }
