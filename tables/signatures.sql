DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR(255) NOT NULL CHECK(first !=''),
    last VARCHAR(255) NOT NULL CHECK(last !=''), 
    signature VARCHAR NOT NULL CHECK(signature !='')
);

SELECT * FROM signatures;