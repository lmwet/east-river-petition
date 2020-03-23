const express = require("express");
const app = (exports.app = express());
const db = require("./utils/db.js");
const csurf = require("csurf");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const { hash, compare } = require("./utils/bcrypt");
const {
    requireLoggedOutUser,
    requireNoSignature,
    requireSignature,
    makeCookiesSafe,
    requireLoggedInUser
} = require("./middleware");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

////////////// OLD MIDDLEWARE //////////////

app.use(express.static("./public"));
app.use(express.static("./views/images"));

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(
    cookieSession({
        secret: `secretssss`,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 10
    })
);

app.use(csurf());
app.use(makeCookiesSafe);

////////////////////////////////////// REGISTER AND LOGIN //////////////////////////////////////

// GET REGISTER
app.get("/register", requireLoggedOutUser, (req, res) => {
    req.session.user = {};
    res.render("register", {
        layout: "main",
        title: "Sign-up",
        userLogedOut: true
    });
    console.log("made it into register route");
});

//POST REGISTER and remembering the user in cookiesession
app.post("/register", requireLoggedOutUser, (req, res) => {
    const first = req.body.firstname;
    const last = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    //check if the user has already register with same names
    db.userCheckin(first, last)
        .then(data => {
            //if there is a result to the query, then redirect the user to login page
            console.log("erwisht! go login", data.rows[0]);
            res.redirect("/login");
        })
        .catch(e => {
            console.log("user is checked in!", e);

            //hashing and salting the passwords
            hash(password)
                .then(hashedPw => {
                    //saving users data to users table in petition db
                    db.addUser(first, last, email, hashedPw)
                        .then(data => {
                            console.log("current user data", data.rows[0]);

                            //remembering user_id and email in the session cookie for login
                            req.session.user.email = data.rows[0].email;
                            req.session.user.user_id = data.rows[0].id;
                            req.session.user.first = data.rows[0].first;
                            req.session.user.last = data.rows[0].last;
                            // console.log("req.session object", req.session);
                            res.redirect("/profile");
                        })
                        .catch(e => {
                            console.log("error in Post register in hash", e);
                            res.render("register", {
                                layout: "main",
                                error_message: true,
                                title: "Sign Up Error",
                                userLogedOut: true
                            });
                        });
                })
                .catch(e => {
                    console.log("error in Post register in hash", e);
                    res.sendStatus(500);

                    res.render("register", {
                        layout: "main",
                        error_message: true,
                        title: "Sign Up Error"
                    });
                });
        });
});

// GET LOGIN
app.get("/login", requireLoggedOutUser, (req, res) => {
    req.session.user = {};
    console.log("made it into login route");

    res.render("login", {
        layout: "main",
        title: "Login"
    });
});

//POST LOGIN
app.post("/login", requireLoggedOutUser, (req, res) => {
    console.log("made it into login route");

    //comparing hashed PW from database to input and saving user's id into the session
    db.login(req.body.email).then(data => {
        console.log("pw in login object", data.rows[0]);

        compare(req.body.password, data.rows[0].password)
            .then(boolean => {
                console.log("result of compare", boolean);

                if (boolean) {
                    if (data.rows[0].user_id) {
                        console.log(
                            "user has signed already",
                            data.rows[0].user_id,
                            data.rows[0].id
                        );
                        req.session.user.user_id = data.rows[0].id;
                        req.session.user.first = data.rows[0].first;
                        req.session.user.last = data.rows[0].last;
                        res.redirect("/thanks");
                    } else {
                        console.log("user hasnt signed yet");
                        req.session.user.user_id = data.rows[0].id;
                        req.session.user.first = data.rows[0].first;
                        req.session.user.last = data.rows[0].last;
                        res.redirect("/petition");
                    }
                } else {
                    console.log("this is not a match");
                    res.render("login", {
                        layout: "main",
                        title: "Login",
                        error_message: true
                    });
                }
            })
            .catch(err => {
                console.log("err in login", err);
            });
    });
});

//LOGOUT
app.get("/logout", requireLoggedInUser, (req, res) => {
    req.session = null;
    res.redirect("/login");
});

//////////// OTHER ROUTES ////////////
// Home route is just a landing page and creates a user object
app.get("/", (req, res) => {
    req.session.user = {};
    db.countSignatures()
        .then(data => {
            const count = data.rows[0].count;
            console.log("count", count);

            res.render("home", {
                layout: "main",
                title: "Home",
                count,
                userLogedOut: true
            });
        })
        .catch(err => {
            console.log("err in count", err);
        });
});

// GET PROFILE
app.get("/profile", requireLoggedInUser, (req, res) => {
    console.log("profile route runnin");
    const first = req.session.user.first;
    const last = req.session.user.last;
    res.render("profile", {
        layout: "main",
        title: "Profile",
        first,
        last,
        userLogedIn: true
    });
});

//POST PROFILE
app.post("/profile", requireLoggedInUser, (req, res) => {
    console.log("ran post profile route");
    ////////////////////////////////////////////////////////////
    //handle the fact that they are not required fields :/
    ////////////////////////////////////////////////////////////
    const user_id = req.session.user.user_id;
    console.log("req.session.user_id on post profile", user_id);

    //remember the user's city for the "get users by city" route
    const city = req.body.city;
    req.session.user.city = city;

    const age = req.body.age;

    //handle the https prefixe problem
    let url = req.body.url;
    console.log("url post profile", url.startsWith("http://" || "https://"));

    if (!url.startsWith("http://" || "https://")) {
        url = null;
    }

    db.addProfile(age, city, url, user_id)
        .then(data => {
            res.redirect("/petition");
            console.log("object from the profile-form ", data);
        })
        .catch(err => {
            console.log("err in addSigner", err);
        });
});

//GET EDIT PROFILE
app.get("/profile/edit", requireLoggedInUser, (req, res) => {
    console.log("profile/edit route runnin");

    const user_id = req.session.user.user_id;
    db.editProfile(user_id)
        .then(data => {
            const first = req.session.user.first;
            const last = req.session.user.last;
            const profile = data.rows[0];

            res.render("edit-profile", {
                layout: "main",
                title: "Edit your profile",
                profile,
                first,
                last,
                userLogedIn: true
            });
        })
        .catch(err => console.log("err in editProfile: ", err));
});

// //POST EDIT PROFILE
app.post("/profile/edit", requireLoggedInUser, (req, res) => {
    console.log("ran post profile-edit route");
    //handle the fact that they are not required fields :/
    const first = req.body.firstname;
    const last = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;
    const user_id = req.session.user.user_id;
    const age = req.body.age;
    const city = req.body.city;
    const url = req.body.url;

    //updating the users DB
    hash(password)
        .then(password => {
            db.updateUsers(first, last, password, user_id, email)
                .then(data => {
                    console.log("updates from users", data);

                    //updating the user_profiles DB
                    db.updateUserProfiles(age, city, url, user_id)
                        .then(data => {
                            console.log(
                                "updates from user_profiles",
                                data.rows
                            );
                        })
                        .catch(err => {
                            console.log(
                                "err in updating user_profiles table for profile/edit",
                                err
                            );
                        });
                    res.redirect("/petition");
                })
                .catch(err => {
                    console.log("err in update users", err);
                });
        })
        .catch(err => {
            console.log("err in hash password in update users", err);
        });
});

// GET PETITION: signing page
//always renders petition.handlebars with no error
app.get("/petition", requireNoSignature, (req, res) => {
    const first = req.session.user.first;
    const last = req.session.user.last;
    console.log("petition home route runnin");
    res.render("petition", {
        layout: "main",
        title: "Petition",
        first,
        last,
        userLogedIn: true
    });
});

// POST PETITION
//save data into db
app.post("/petition", requireNoSignature, (req, res) => {
    console.log("ran post petition route");
    const signature = req.body.hiddenField;
    const user_id = req.session.user.user_id;
    console.log("user_id in add signer", user_id);

    if (!req.session.user.signatureId) {
        db.addSigner(user_id, signature)
            .then(data => {
                req.session.user.signatureId = data.rows[0].id;
                console.log(
                    "user object in session in addSigner after signatureId",
                    req.session.user
                );
                res.redirect("/thanks");
            })
            .catch(err => {
                console.log("err in addSigner", err);
                res.render("petition", {
                    layout: "main",
                    error_message: true,
                    title: "Petition-signing-error",
                    userLogedIn: true
                });
            });
    } else {
        res.redirect("/thanks");
    }
});

// GET THANKS
//if petition is signed this page shall be served
app.get("/thanks", requireSignature, (req, res) => {
    console.log("made it into thanks route");
    db.getSigner()
        .then(data => {
            const signatureGraph = data.rows[0].signature;
            const first = req.session.user.first;
            const last = req.session.user.last;
            res.render("thanks", {
                layout: "main",
                title: "Thank you!",
                signatureGraph,
                first,
                last,
                userLogedIn: true
            });
        })
        .catch(err => console.log("err in getSigner: ", err));
});

// POST THANKS: delete signature
app.post("/thanks", requireSignature, (req, res) => {
    console.log("ran post thanks route");
    const user_id = req.session.user.user_id;
    db.deleteSignature(user_id)
        .then(data => {
            //deleting users signature in session
            req.session.user.signatureId = null;
            console.log(
                "user object in session after deleting siggnature and timestamp",
                req.session.user
            );

            res.redirect("/register");
        })
        .catch(err => {
            console.log("err in delet signature", err);
            res.render("petition", {
                layout: "main",
                error_message: true,
                title: "Deleting-signing-error",
                userLogedIn: true
            });
        });
});

//Before you put the url a user specifies into the href attribute of a link, you must make sure that it begins with either "http://" or "https://". This is not just to ensure that the link goes somewhere outside of your site, althoug that is a benefit. It is also important for security. Since browsers support Javascript URLs, we must make sure that a malicious user can't create a link that runs Javascript code when other users click on it. You can decide whether to check the url when the user inputs it (before you insert it into the database) or when you get it out of the database (before you pass it to your template).
//If it doesn't start with "http://" or "https://", do not put it in an href attribute.
// GET SIGNERS : serving the list of signers
app.get("/signers", requireLoggedInUser, (req, res) => {
    console.log("made it into signers route");
    db.getSigners()
        .then(data => {
            const signers = data.rows;
            const first = req.session.user.first;
            const last = req.session.user.last;

            res.render("signers", {
                layout: "main",
                title: "Signers",
                signers,
                first,
                last,
                userLogedIn: true
            });
        })
        .catch(err => console.log("err in getSigners: ", err));
});

// GET SIGNERS BY CITY
app.get("/signers/:city", requireLoggedInUser, (req, res) => {
    console.log("made it into signers-by-city route");
    const city = req.params.city;
    const first = req.session.user.first;
    const last = req.session.user.last;
    db.getSignersByCity(city)
        .then(data => {
            const signersByCity = data.rows;

            // console.log("signersByCity", signersByCity);

            res.render("signers", {
                layout: "main",
                title: "Signers by cities",
                SignersByCity: true,
                signersByCity,
                city,
                first,
                last,
                userLogedIn: true
            });
        })
        .catch(err => console.log("err in get signers by city: ", err));
});

//do my-profile route here

//about route
app.get("/about", (req, res) => {
    const first = req.session.user.first;
    const last = req.session.user.last;

    res.render("about", {
        layout: "main",
        title: "About",
        first,
        last
    });
    console.log("made it into about route");
});

//contact route
app.get("/contact", (req, res) => {
    const first = req.session.user.first;
    const last = req.session.user.last;

    res.render("contact", {
        layout: "main",
        title: "Contact us",
        first,
        last
    });
    console.log("made it into contact route");
});

app.listen(process.env.PORT || "8080", () =>
    console.log("petition server hello")
);
