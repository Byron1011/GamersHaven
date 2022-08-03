const express = require("express");

const Product = require("../Models/product");
const Review = require("../Models/review");
const User = require("../Models/user");
const OrderItem = require("../Models/orderItem");
const SmartError = require("../utils/SmartError");
const asyncWrapper = require("../utils/asyncWrapper");
const validateProduct = require("../utils/validators/validateProduct");
const deleteAllReviewsFromProduct = require("../utils/deleteAllReviewsFromProduct");
const isLoggedIn = require("../utils/isLoggedIn");
const ownsProduct = require("../utils/ownsProduct");

const productRouter = express.Router();

// get form to create new product
productRouter.get("/new", isLoggedIn, (req, res, next) => {
    res.render("products/new");
});

// make new product
productRouter.post("/", isLoggedIn, validateProduct, asyncWrapper(async (req, res, next) => {
    // need to validate product data
    // need to wrap in case async stuff goes wrong

    const productData = req.body;
    const author = req.user;

    const product = new Product({ ...productData, author });
    await product.save();

    // todo send to product show not all products
    res.redirect("/products");
}));

// view all products
productRouter.get("/", asyncWrapper(async (req, res, next) => {
    const products = await Product.find();
    res.render("products/index", { products });
}));

// view individual products
productRouter.get("/:productId", asyncWrapper(async (req, res, next) => {
    // todo if productId is not referencing an actuall Product throw error
    const { productId } = req.params;
    const product = await Product.findById(productId).populate({
        path: "reviews",
        populate: {
            path: "author"
        }
    }).populate("author");

    if (!product) next(new SmartError(500, "Product does not exist"));

    res.locals.hasInCart = false;
    res.locals.quantityInCart = 0;

    // if user is logged in, check if they already have this product in their cart attribute on user model
    if (req.user) {
        const user = await User.findById(req.user._id).populate("cart");
        populatedCart = user.cart;
        for (const orderItem of populatedCart) {
            if (orderItem.product.equals(productId)) {
                res.locals.hasInCart = true;
                res.locals.quantityInCart = orderItem.quantity;
            }
        }
    } else { // if user is not logged in, check if they have the product in the session "cart"
        for (const item of req.session.cart) {
            if (item.product._id === productId) {
                res.locals.hasInCart = true;
                res.locals.quantityInCart = item.quantity;
            }
        }
    }

    res.render("products/show", { product });
}));

// get form to edit a product
productRouter.get("/:productId/edit", isLoggedIn, ownsProduct, asyncWrapper(async (req, res, next) => {
    // todo if productId is not referencing an actuall Product throw error
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) next(new SmartError(500, "Product does not exist"));

    res.render("products/edit", { product })
}));

// edit a product 
productRouter.put("/:productId", isLoggedIn, ownsProduct, validateProduct, asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const productData = req.body;
    const product = await Product.findByIdAndUpdate(productId, productData);

    if (!product) next(new SmartError(500, "Product does not exist"));

    await product.save();
    res.redirect(`/products/${productId}`);
}));

// delete a product
productRouter.delete("/:productId", isLoggedIn, ownsProduct, deleteAllReviewsFromProduct, asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;

    // delete all cartInstances (which are orderItems) when product is deleted
    const product = await Product.findById(productId).populate("cartInstances").populate("orderInstances");
    const { cartInstances, orderInstances } = product;

    // change all elements in Product.orderInstances array to have attribute "productStillAvailable" to false
    for (const orderInstance of orderInstances) {
        orderInstance.productStillAvailable = false;
        orderInstance.product = null;
        await orderInstance.save();
    }
    console.log("sneaky sneaky");
    // delete item from user.cart and orderitem instance
    for (const cartInstance of cartInstances) {
        const userId = cartInstance.author;
        console.log(cartInstance)

        console.log("HOT DAWG");
        console.log(userId);

        const user = await User.findByIdAndUpdate(userId, { $pull: { cart: cartInstance._id } });
        await user.save();
        console.log("no you");
        await OrderItem.findByIdAndDelete(cartInstance._id);
    }


    await Product.findByIdAndDelete(productId);

    res.redirect("/products");
}));

module.exports = productRouter;