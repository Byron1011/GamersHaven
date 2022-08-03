const asyncWrapper = require("./asyncWrapper");
const Product = require("../Models/product");

const ownsProduct = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate("author");
    if (req.user.equals(product.author)) next();
    else {
        req.flash("flashErrors", "You must own that product to do that");
        res.redirect(`/products/${productId}`);
    }
});

module.exports = ownsProduct;