DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL CHECK(signature !=''),
    user_id INTEGER NOT NULL REFERENCES users(id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- foreign key lets us identify which user from the users table signed the petition
-- and which signature is theirs (acts as an identifier for the 2 tables!)

SELECT * FROM signatures;

