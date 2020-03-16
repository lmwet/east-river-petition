const spicedPg = require("spiced-pg");
const db = spicedPg(
    "postgres:postgres:postgres:@localhost@localhost:5432/petition"
);

module.exports.addSigner = (first, last, signature) => {
    const q = `
    INSERT into signatures (first, last, signature)
    VALUES ($1, $2, $3)
    RETURNING *
    `; // this is security stuff preventing SQL injection
    const params = [first, last, signature];
    return db.query(q, params);
};

module.exports.getSignatures = () => {
    const q = `SELECT * FROM signatures`;
    return db.query(q);
};

module.exports.getSigner = () => {
    const q = `SELECT * FROM signatures ORDER BY ID DESC LIMIT 1`;
    console.log(q);

    return db.query(q);
};
