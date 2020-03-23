const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres:@localhost@localhost:5432/petition"
);

//saves a signature in signatures DB
module.exports.addSigner = (user_id, signature) => {
    const q = `
    INSERT into signatures (user_id, signature)
    VALUES ($1, $2)
    RETURNING *
    `;
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
 LEFT JOIN user_profiles ON user_profiles.user_id = users.id;`; // = users that just signed and those who submitted a profile
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

//GET to profile/edit: output users profile data into the input fields
exports.editProfile = user_id => {
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
 LEFT OUTER JOIN user_profiles 
 ON user_profiles.user_id = users.id
 WHERE users.id = $1;`;
    const params = [user_id];
    return db.query(q, params);
};

//POST to profile/edit: upserting the data submitted by the user editing their profile
exports.updateUsers = (first, last, password, id, email) => {
    // query to edit users table
    const q = `UPDATE users
    SET first = $1, last = $2, email = $5, password = $3
    WHERE id = $4
    AND password <> $3
    RETURNING *`;

    console.log(q);
    const params = [first, last, password, id, email];
    return db.query(q, params);
};

exports.updateUserProfiles = (age, city, url, user_id) => {
    //UPSERT in user_profiles
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id)
            DO UPDATE SET age = $1, city = $2, url = $3
            RETURNING *`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

//LOGIN
exports.login = email => {
    const q = `SELECT  
    users.first,
    users.last,
    users.id,
    users.password,
    signatures.user_id
    FROM users 
    LEFT OUTER JOIN signatures ON signatures.user_id = users.id
    WHERE email = $1`;
    //need some extra stuff
    const params = [email];
    return db.query(q, params);
};

//DELETE signature from /thanks post route
exports.deleteSignature = user_id => {
    const q = `DELETE
    FROM signatures
    WHERE user_id = $1`;
    const params = [user_id];
    return db.query(q, params);
};

exports.countSignatures = () => {
    const q = `SELECT COUNT (signature) 
    FROM signatures`;
    return db.query(q);
};

exports.userCheckin = (first, last) => {
    // NOT WORKING
    const q = `SELECT 
    first, 
    last
    FROM users 
    WHERE first = $1, last = $2`;
    const params = [first, last];
    return db.query(q, params);
};
