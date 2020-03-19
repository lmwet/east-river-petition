const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres:@localhost@localhost:5432/petition"
);

module.exports.addSigner = (user_id, signature) => {
    const q = `
    INSERT into signatures (user_id, signature)
    VALUES ($1, $2)
    RETURNING *
    `; // this is security stuff preventing SQL injection
    const params = [user_id, signature];
    return db.query(q, params);
};

//gets users who signed to render in template "signers"
module.exports.getSigners = () => {
    const q = `SELECT
    users.first,
    users.last, 
    signatures.user_id,
    user_profiles.age,
    user_profiles.city,
    user_profiles.url
 FROM
    users 
 JOIN signatures ON signatures.user_id = users.id    
 JOIN user_profiles ON user_profiles.user_id = users.id;`; // = users that just signed and those who submitted a profile
    return db.query(q);
};

//get signers by city to optionnally render in template "signers"
exports.getSignersByCity = city => {
    const q = `SELECT
    users.first,
    users.last, 
    signatures.user_id,
    user_profiles.age,
    user_profiles.city,
    user_profiles.url
 FROM
    users 
 JOIN signatures ON signatures.user_id = users.id    
 JOIN user_profiles ON user_profiles.user_id = users.id
 WHERE LOWER(user_profiles.city) = LOWER($1);`;

    const params = [city];
    return db.query(q, params);
};

//gets the current signer to render signature in template "petition"
exports.getSigner = () => {
    const q = `SELECT * FROM signatures ORDER BY ID DESC LIMIT 1`;
    return db.query(q);
};

//  POST to /register
exports.addUser = (first, last, email, password) => {
    const q = `INSERT into users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    console.log(q);
    const params = [first, last, email, password];
    return db.query(q, params);
};

// POST to /profile
exports.addProfile = (age, city, url, user_id) => {
    const q = `INSERT into user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    console.log(q);
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

//GET to profile/edit: selects the user-infos to output into the input fields
exports.editProfile = () => {
    const q = `SELECT
    users.id,
    users.first,
    users.last,
    users.email,
    users.password,
    user_profiles.age,
    user_profiles.city,
    user_profiles.url,
    user_profiles.user_id
 FROM
    users
 LEFT JOIN user_profiles ON user_profiles.user_id = users.id
 ORDER BY 
 users.id DESC;`;
    return db.query(q);
};

//POST to profile/edit:
////////////////////////////////////

//LOGIN
// Change the query that retrieves information from the users table by email address so that it also gets data from the signatures table. Thus you will be able to know whether the user has signed the petition or not as soon as they log in.
exports.getSignedInUser = () => {
    const q = `SELECT * FROM signatures ORDER BY ID DESC LIMIT 1`;
    ///email stuff
    return db.query(q);
};
