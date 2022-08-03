const asyncWrapper = require("./asyncWrapper");
const Product = require("../Models/product");
const Review = require("../Models/review");
const User = require("../Models/user");
const OrderItem = require("../Models/orderItem");

const addItemsToCart = asyncWrapper(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
        path: "cart",
        populate: {
            path: "product"
        }
    });

    populatedCart = user.cart;

    for (const sessionItem of req.session.cart) {
        let itemExistedInCart = false;

        // check if user already has some of this orderItem in their cart, if so, update the quantity. else add new orderItem
        for (const cartItem of populatedCart) {
            if (sessionItem.product._id === cartItem.product._id.toString()) {
                const newQuantity = sessionItem.quantity;

                const orderItem = await OrderItem.findByIdAndUpdate(cartItem._id, { quantity: newQuantity });
                await orderItem.save();
                itemExistedInCart = true;
            }
        }

        if (!itemExistedInCart) {
            // create new orderItem
            const { product, quantity } = sessionItem;

            // above is product from session, check if real product from db below
            const productFromDb = await Product.findById(product._id);

            const orderItem = new OrderItem({
                author: user,
                product,
                quantity
            });
            await orderItem.save();

            // add new orderItem to user cart

            user.cart.push(orderItem);
            await user.save();

            // add new orderItem to Product cartInstances
            productFromDb.cartInstances.push(orderItem);
            await productFromDb.save();
        }
    }

    // clear cart from session
    delete req.session.cart;

    next();
});

module.exports = addItemsToCart;