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

app.use(csurf());

app.use(function(req, res, next) {
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

//////////// ROUTES ////////////

//redirects to /thanks if there is a cookie
//always renders petition.handlebars with no error

app.get("/petition", (req, res) => {
    //error handling
    console.log("petition route runnin");

    res.render("petition", {
        layout: "main",
        title: "Petition"
    });
});

app.post("/petition", (req, res) => {
    console.log("-----------");
    console.log("ran post petition route");
    console.log("-----------");

    const first = req.body.firstname;
    const last = req.body.lastname;
    const signature = req.body.hiddenField;
    console.log("signature", req.body.hiddenField);

    db.addSigner(first, last, signature)
        .then(form => {
            // addSigner(form); is not defined...
        })
        .catch(err => console.log("err in addSigner", err));
    res.redirect("/thanks");
});

app.get("/thanks", (req, res) => {
    res.render("thanks", {
        layout: "main",
        title: "Thank you!"
    });
    console.log("made it into thnks route");
});
app.listen("8080", () => console.log("petition server hello"));
