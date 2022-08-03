const asyncWrapper = require("./asyncWrapper");
const Product = require("../Models/product");
const Review = require("../Models/review");

const deleteAllReviewsFromProduct = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    for (const reviewId of product.reviews)
        await Review.findByIdAndDelete(reviewId);

    next();
});

module.exports = deleteAllReviewsFromProduct;