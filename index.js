const express = require("express");
const app = (exports.app = express());
const db = require("./utils/db.js");
// const csurf = require("csurf");
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

// req.session is an object that you attach properties to ie signature id
// DONT CHANGE ORDER INHERE!
app.use(
    cookieSession({
        secret: `secretssss`,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 10
    })
);

// app.use(csurf());

app.use(makeCookiesSafe);

////////////////////////////////////// REGISTER AND LOGIN //////////////////////////////////////

// GET REGISTER
app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        layout: "main",
        title: "Sign-up"
    });
    console.log("made it into register route");
});

//POST REGISTER and remembering the user in cookiesession
app.post("/register", requireLoggedOutUser, (req, res) => {
    const first = req.body.firstname;
    const last = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

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
                    console.log("req.session object", req.session);
                    res.redirect("/profile");
                })
                .catch(e => {
                    console.log("error in Post register in hash", e);
                    res.render("register", {
                        layout: "main",
                        error_message: true,
                        title: "Sign Up Error"
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

// GET LOGIN
app.get("/login", requireLoggedOutUser, (req, res) => {
    console.log("made it into login route");

    res.render("login", {
        layout: "main",
        title: "Login"
    });
});

//POST LOGIN TO BE DONE HERE
app.post("/login", requireLoggedOutUser, (req, res) => {
    console.log("made it into login route");

    // db.///
});

//GET LOGOUT TO BE DONE HERE

//////////// ROUTES ////////////
// Home route is just redirecting and creating the user object to the session
app.get("/", (req, res) => {
    req.session.user = {};
    res.redirect("/register");
    console.log("GET / ROUTE REDIRECTING TO / REGISTER");
});

app.use(requireLoggedInUser);

// GET PROFILE
app.get("/profile", requireLoggedInUser, (req, res) => {
    console.log("profile route runnin");

    res.render("profile", {
        layout: "main",
        title: "Profile"
    });
});

//POST PROFILE
app.post("/profile", requireLoggedInUser, (req, res) => {
    console.log("ran post profile route");
    ////////////////////////////////////////////////////////////
    //handle the fact that they are not required fields :/
    ////////////////////////////////////////////////////////////
    const age = req.body.age;

    const city = req.body.city;
    const url = req.body.url;
    const user_id = req.session.user.user_id;
    console.log("req.session.user_id on post profile", user_id);
    //remember the user's city for the "get users by city" rout
    req.session.user.city = city;

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

    db.editProfile()
        .then(data => {
            const profile = data.rows[0];
            console.log("profile", profile);
            res.render("edit-profile", {
                layout: "main",
                title: "Edit your profile",
                profile
            });
        })
        .catch(err => console.log("err in editProfile: ", err));
});

// first, last, age, city, url, user_id, password

// //POST EDIT PROFILE
// app.post("/profile/edit", requireLoggedInUser, (req, res) => {
//     console.log("ran post profile-edit route");
//     //handle the fact that they are not required fields :/
//     const age = req.body.age;
//     const city = req.body.city;
//     const url = req.body.url;
//     const user_id = req.session.user.user_id;
//     console.log("req.session.user_id on post profile", user_id);
//     //remember the user's city for the "get users by city" rout
//     req.session.user.city = city;

//     db.editProfile(first, last, age, city, url, user_id, password)
//     .then(data => {
//         const age = data.rows[0].age;

//         res.render("thanks", {
//             layout: "main",
//             title: "Thank you!",
//             signatureGraph
//         });
// });

// GET PETITION: signing page
//always renders petition.handlebars with no error
app.get("/petition", requireNoSignature, (req, res) => {
    console.log("petition home route runnin");
    res.render("petition", {
        layout: "main",
        title: "Petition"
    });
});

// POST PETITION
//save data into db
app.post("/petition", requireNoSignature, (req, res) => {
    console.log("ran post petition route");
    const signature = req.body.hiddenField;
    const user_id = req.session.user.user_id;
    console.log("user_id in add signer", user_id);

    db.addSigner(user_id, signature)
        .then(data => {
            //setting cookie to remember the users signature
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
                title: "Petition-signing-error"
            });
        });
});

// GET THANKS
//if petition is signed this page shall be served
app.get("/thanks", requireSignature, (req, res) => {
    console.log("made it into thanks route");
    db.getSigner()
        .then(data => {
            const signatureGraph = data.rows[0].signature;

            res.render("thanks", {
                layout: "main",
                title: "Thank you!",
                signatureGraph,
                navbar,
                profileInfos: true
            });
        })
        .catch(err => console.log("err in getSigner: ", err));
});

//Before you put the url a user specifies into the href attribute of a link, you must make sure that it begins with either "http://" or "https://". This is not just to ensure that the link goes somewhere outside of your site, althoug that is a benefit. It is also important for security. Since browsers support Javascript URLs, we must make sure that a malicious user can't create a link that runs Javascript code when other users click on it. You can decide whether to check the url when the user inputs it (before you insert it into the database) or when you get it out of the database (before you pass it to your template).
//If it doesn't start with "http://" or "https://", do not put it in an href attribute.
// GET SIGNERS : serving the list of signers
app.get("/signers", requireSignature, (req, res) => {
    console.log("made it into signers route");
    db.getSigners()
        .then(data => {
            const signers = data.rows;
            // console.log("signers", signers);

            res.render("signers", {
                layout: "main",
                title: "Signers",
                signers,
                navbar,
                profileInfos: true
            });
        })
        .catch(err => console.log("err in getSigners: ", err));
});

// GET SIGNERS BY CITY
app.get("/signers/:city", requireSignature, (req, res) => {
    console.log("made it into signers-by-city route");
    const city = req.params.city;

    db.getSignersByCity(city)
        .then(data => {
            const signersByCity = data.rows;
            // console.log("signersByCity", signersByCity);

            res.render("signers", {
                layout: "main",
                title: "Signers by cities",
                SignersByCity: true,
                signersByCity,
                navbar,
                profileInfos: true,
                city
            });
        })
        .catch(err => console.log("err in get signers by city: ", err));
});

//do my-profile route

//do about route

//do contact route

app.listen(process.env.PORT || "8080", () =>
    console.log("petition server hello")
);
