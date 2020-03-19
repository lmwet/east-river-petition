exports.requireLoggedOutUser = (req, res, next) => {
    if (req.session.user && req.session.user.user_id) {
        res.redirect("/petition");
    } else {
        next();
    }
};

exports.requireSignature = (req, res, next) => {
    if (!req.session.user.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

exports.requireNoSignature = (req, res, next) => {
    if (req.session.user.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

exports.makeCookiesSafe = (req, res, next) => {
    res.set("x-frame-options", "deny");
    // res.locals.csrfToken = req.csrfToken();
    next();
};

exports.requireLoggedInUser = (req, res, next) => {
    if (
        !req.session.user.user_id &&
        req.url != "/register" &&
        req.url != "/login"
    ) {
        res.redirect("/register");
    } else {
        next();
    }
};
