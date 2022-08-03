// main file that starts the server and puts together the routes

// require node modules
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");
const methodOverride = require("method-override");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');

// require custom exports
const SmartError = require("./utils/SmartError");
const User = require("./Models/user");
const asyncWrapper = require("./utils/asyncWrapper");

// start the server
const app = express();

// use ejs as templating language
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs")

// tell express how to pare form body
app.use(express.urlencoded({ extended: true }));

// fake PUT (and other) requests from form
app.use(methodOverride('_method', ["POST", "GET"]));

// mongoose / mongo stuff
mongoose.connect('mongodb://localhost:27017/gamers-haven', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// configure sessions
const millisecondsInWeek = 1000 * 60 * 60 * 24 * 7;

const sessionConfigurations = {
    secret: "youbettermakesuretochangeme",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + millisecondsInWeek,
        maxAge: millisecondsInWeek
    }
}

app.use(session(sessionConfigurations));
app.use(flash());

// // configure passport
app.use(passport.initialize());
app.use(passport.session()); // session must be app.used() before useing passport.session
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

let orderNumber = 1;

// set res.locals
app.use(asyncWrapper(async (req, res, next) => {
    res.locals.flashErrors = req.flash("flashErrors");
    res.locals.flashSuccess = req.flash("flashSuccess");
    res.locals.user = req.user;


    // if user is logged in, use the cart field on the User
    if (req.user) {
        const user = await User.findById(req.user._id).populate({
            path: "cart",
            populate: {
                path: "product"
            }
        });
        res.locals.cart = user.cart;
    }
    // if user is NOT logged in, use the cart field in the session
    else {
        // session may be undefined, if so, set it as an empty array
        if (!req.session.cart) req.session.cart = [];
        res.locals.cart = req.session.cart;
    }

    // if there is returnTo only keep it if the user is going to /login, else delete it
    if (req.session.returnTo && req.originalUrl !== "/login") {
        delete req.session.returnTo;
    }
    next();
}));

// home route
app.get("/", (req, res, next) => {
    res.send("No home route yet but one is on the way");
});

// use routers
const productRouter = require("./Routers/productRouter");
app.use("/products", productRouter);

const reviewRouter = require("./Routers/reviewRouter");
app.use("/products/:productId/reviews", reviewRouter);

const userRouter = require("./Routers/userRouter");
app.use("/", userRouter);

// 404 page not found
app.all("*", (req, res, next) => {
    next(new SmartError(404, "Page not found"))
});

// error handling middleware
app.use(async (err, req, res, next) => {
    // todo make error template
    res.render("error", { err });
});


app.listen(3000, () => {
    console.log("Welcome to GamersHaven! My name is Alfred and I'll be your server!");
})