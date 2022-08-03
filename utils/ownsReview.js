const asyncWrapper = require("./asyncWrapper");
const Review = require("../Models/review");

const ownsReview = asyncWrapper(async (req, res, next) => {
    const { productId, reviewId } = req.params;
    const review = await Review.findById(reviewId).populate("author");
    if (req.user.equals(review.author)) next();
    else {
        req.flash("flashErrors", "You must own that review to do that");
        res.redirect(`/products/${productId}`);
    }
});

module.exports = ownsReview;