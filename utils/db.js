const spicedPg = require("spiced-pg");
const db = spicedPg(
    "postgres:postgres:postgres:@localhost@localhost:5432/petition"
);

module.exports.addSigner = (signature, user_id) => {
    const q = `
    INSERT into signatures (user_id, signature)
    VALUES ($1, $2)
    RETURNING *
    `; // this is security stuff preventing SQL injection
    const params = [signature, user_id];
    return db.query(q, params);
};

module.exports.getSignatures = () => {
    const q = `SELECT * FROM signatures`;
    return db.query(q);
};

module.exports.getSigner = () => {
    const q = `SELECT * FROM signatures ORDER BY ID DESC LIMIT 1`;
    return db.query(q);
};

module.exports.addUser = (first, last, email, password) => {
    const q = `INSERT into users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    console.log(q);
    const params = [first, last, email, password];
    return db.query(q, params);
};
