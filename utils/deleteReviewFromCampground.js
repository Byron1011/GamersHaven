const Product = require("../Models/product");
const Review = require("../Models/review");
const asyncWrapper = require("./asyncWrapper");

const deleteReviewFromCampground = asyncWrapper(async (req, res, next) => {
    const { productId, reviewId } = req.params;
    const product = await Product.findByIdAndUpdate(productId, { $pull: { reviews: reviewId } });
    next();
});

module.exports = deleteReviewFromCampground;