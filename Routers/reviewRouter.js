const express = require("express");
const Product = require("../Models/product");
const Review = require("../Models/review");

const SmartError = require("../utils/SmartError");
const asyncWrapper = require("../utils/asyncWrapper");
const validateReview = require("../utils/validators/validateReview");
const deleteReviewFromCampground = require("../utils/deleteReviewFromCampground");
const isLoggedIn = require("../utils/isLoggedIn");
const ownsReview = require("../utils/ownsReview");

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.post("/", isLoggedIn, validateReview, asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;

    // make new review
    const reviewData = req.body;
    const author = req.user;
    const review = await new Review({ ...reviewData, author });
    await review.save();



    // add review reference to product
    const product = await Product.findById(productId);
    product.reviews.push(review);
    await product.save();

    req.flash("flashSuccess", "Successfully created review!")
    res.redirect(`/products/${productId}`);
}));

reviewRouter.delete("/:reviewId", isLoggedIn, ownsReview, deleteReviewFromCampground, asyncWrapper(async (req, res, next) => {
    const { productId, reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/products/${productId}`);
}));





module.exports = reviewRouter;
