const express = require("express");
const app = express();
const db = require("./db");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");

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
app.use((req, res, next) => {
    if (req.session.signatureId && req.url === "/petition") {
        res.redirect("/thanks");
    } else if (!req.session.signatureId && req.url === "/thanks") {
        res.redirect("/petition");
    } else {
        next();
    }
});
//////////// ROUTES ////////////

//always renders petition.handlebars with no error
app.get("/petition", (req, res) => {
    console.log("petition home route runnin");

    res.render("petition", {
        layout: "main",
        title: "Petition"
    });
});

//post request to /petition
//save date into db
app.post("/petition", (req, res) => {
    console.log("-----------");
    console.log("ran post petition route");
    console.log("-----------");

    const first = req.body.firstname;
    const last = req.body.lastname;
    const signature = req.body.hiddenField;
    // const log = req.body.tstamp;
    // console.log("signature", req.body.tstamp);

    db.addSigner(first, last, signature)
        .then(data => {
            console.log("data object from post request", data.rows);
            //setting cookie to remember the users signature
            req.session.signatureId = data.rows[0].id;
            res.redirect("/thanks");
        })
        .catch(err => {
            console.log("err in addSigner", err);
            res.render("petition", {
                layout: "main",
                error_message: true,
                title: "Petition"
            });
        });
});

//if petition is signed this page shall be served
app.get("/thanks", (req, res) => {
    res.render("thanks", {
        layout: "main",
        title: "Thank you!"
    });
    console.log("made it into thanks route");
});

//route to signers page
app.get("/thanks/signers", (req, res) => {
    console.log("made it into signers route");
    db.getSignatures()
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
app.listen("8080", () => console.log("petition server hello"));
