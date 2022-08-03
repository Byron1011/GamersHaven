const isLoggedIn = (req, res, next) => {
    if (req.user) return next();

    req.flash("flashErrors", "YOU MUST BE LOGGED IN");
    req.session.returnTo = req.originalUrl;

    res.redirect("/login")
};

module.exports = isLoggedIn;