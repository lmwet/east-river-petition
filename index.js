const express = require("express");
const app = express();
const db = require("./utils/db.js");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const { hash, compare } = require("./utils/bcrypt");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(cookieParser());

////////////// MIDDLEWARE //////////////

app.use(express.static("./public"));
app.use(express.static("./views/images"));

// req.session is an object that you attach properties to ie signature id
// DONT CHANGE ORDER INHERE!
app.use(
    cookieSession({
        secret: `secretssss`,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 10
    })
);

app.use(
    express.urlencoded({
        extended: false
    })
);

// app.use(csurf());

//security routine
// app.use(function(req, res, next) {
//     res.set("x-frame-options", "DENY");
//     res.locals.csrfToken = req.csrfToken();
//     next();
// });

//check for previous visit
//redirects to /thanks if there is a cookie
// app.use((req, res, next) => {
//     if (req.session.signatureId && req.url === "/petition") {
//         res.redirect("/thanks");
//     } else if (!req.session.signatureId && req.url === "/thanks") {
//         res.redirect("/petition");
//     } else {
//         next();
//     }
// });

//////////// ROUTES ////////////
// Home route is checking on cookiesession and redirecting
app.get("/", (req, res) => {
    console.log("GET / ROUTE REDIRECTING TO / REGISTER");
    // if cookieSession.oebwowubgr
    res.redirect("/register");
});

// GET PETITION: signing page
//always renders petition.handlebars with no error
app.get("/petition", (req, res) => {
    console.log("petition home route runnin");

    res.render("petition", {
        layout: "main",
        title: "Petition"
    });
});

// POST PETITION
//save data into db
app.post("/petition", (req, res) => {
    console.log("ran post petition route");
    const signature = req.body.hiddenField;
    const user_id = req.session.user_id;
    console.log("user_id", user_id);

    db.addSigner(user_id, signature)
        .then(data => {
            //setting cookie to remember the users signature
            req.session.signatureId = data.rows[0].id;
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
app.get("/thanks", (req, res) => {
    console.log("made it into thanks route");
    db.getSigner()
        .then(data => {
            const signatureGraph = data.rows[0].signature;
            console.log("signatureGraph", signatureGraph);

            res.render("thanks", {
                layout: "main",
                title: "Thank you!",
                signatureGraph
            });
        })
        .catch(err => console.log("err in getSigner: ", err));
});

// GET SIGNERS : serving the list of signers
app.get("/signers", (req, res) => {
    console.log("made it into signers route");
    db.getSigners()
        .then(data => {
            const signers = data.rows;
            console.log("signers", signers);

            res.render("signers", {
                layout: "main",
                title: "Signers",
                signers
            });
        })
        .catch(err => console.log("err in getSignatures: ", err));
});

////////////////////////////////////// REGISTER AND LOGIN //////////////////////////////////////

// GET REGISTER
app.get("/register", (req, res) => {
    console.log("made it into register route");

    res.render("register", {
        layout: "main",
        title: "Sign-up"
    });
});

//POST REGISTER and remembering the user in cookiesession
app.post("/register", (req, res) => {
    const first = req.body.firstname;
    const last = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    //hashing and salting the passwords
    hash(password)
        .then(hashedPw => {
            console.log("hashedPW", hashedPw);
            // res.sendStatus(200); ???
            //saving users data to users table in petition db
            db.addUser(first, last, email, hashedPw)
                .then(data => {
                    console.log("current user data", data.rows[0]);

                    console.log("req.session object", req.session);

                    req.session.user_id = data.rows[0].id;

                    res.redirect("/petition");
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
app.get("/login", (req, res) => {
    console.log("made it into login route");

    res.render("login", {
        layout: "main",
        title: "Login"
    });
});

//POST LOGIN TO BE DONE HERE

app.listen("8080", () => console.log("petition server hello"));
