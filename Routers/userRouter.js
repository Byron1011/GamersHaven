const express = require("express");
const passport = require("passport");

const Product = require("../Models/product");
const Review = require("../Models/review");
const User = require("../Models/user");
const OrderItem = require("../Models/orderItem");
const Address = require("../Models/address");
const PaymentMethod = require("../Models/paymentMethod");
const Order = require("../Models/order");

const SmartError = require("../utils/SmartError");
const asyncWrapper = require("../utils/asyncWrapper");
const validateProduct = require("../utils/validators/validateProduct");
const deleteAllReviewsFromProduct = require("../utils/deleteAllReviewsFromProduct");
const isLoggedIn = require("../utils/isLoggedIn");
const addItemsToCart = require("../utils/addItemsToCart");
const hasItemInCart = require("../utils/hasItemInCart");
const ownsOrder = require("../utils/ownsOrder");

const userRouter = express.Router();

userRouter.get("/register", (req, res, next) => {
    res.render("users/register");
});

userRouter.post("/register", asyncWrapper(async (req, res, next) => {
    const { username, email, password } = req.body;
    const user = new User({ username, email, cart: [] });
    const registeredUser = await User.register(user, password);

    // user is now in db but is not yet logged in
    req.login(registeredUser, () => {
        res.redirect("/products");
    })
}));

userRouter.get("/login", (req, res, next) => {
    res.render("users/login");
});


userRouter.post("/login", passport.authenticate("local", { failureFlash: true, failureRedirect: "/login", keepSessionInfo: true }), addItemsToCart, asyncWrapper(async (req, res, next) => {
    // if there is a returnTo, redirect user there. else redirect user to /products
    console.log(req.session.returnTo);
    res.redirect(req.session.returnTo || "/products");
}));

userRouter.post("/logout", async (req, res, next) => {
    req.logout(() => {
        res.redirect("/products");
    });
})

userRouter.get("/cart", (req, res, next) => {
    // cart is passed in by a middleware in index.js
    res.render("users/cart");
});

// add item to cart
userRouter.patch("/cart", asyncWrapper(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw new SmartError(500, "Invalid product ID");

    if (quantity < 0) {
        req.flash("flashErrors", "Quantity must be non-negative");
        return res.redirect(`/products/${product._id}`);
    } else if (quantity > product.inStock) {
        req.flash("flashErrors", `Too high a quantity, there are only ${product.inStock} in stock`);
        return res.redirect(`/products/${product._id}`);
    }
    // todo if user has items in cart session and then logs in, add to user Model. (and clear session.cart to [])
    // todo if user has items in user Model and then signs out, do we keep the cart or start from blank

    // if not logged in, add fake order item to session. If user IS logged in, add to cart field in User model
    if (!req.user) {
        for (const item of req.session.cart) {
            if (item.product._id === productId) {
                const newQuantity = req.body.quantity;

                // notice that the delete item from cart route expects the id of the orderItem, but if the user is not logged
                // in their will not be an orderItem in the db, just the cart simulation in the session. The route handler
                // will check if the user is logged in or not and still work, but to reach the route express expects an itemId
                // which doesn't exist so I am just choosing to hardcode it as 00000 when the user is not logged in
                if (newQuantity === "0") return res.redirect(307, `/cart/items/00000?_method=DELETE`);
                else item.quantity = newQuantity;

                req.flash("flashSuccess", "Updated cart");
                return res.redirect("/cart");
            }
        }
        // if we got here the user does not have an orderItem w the product in their cart so make a new "order item" (in session bc not logged in)
        req.session.cart.push({ product, quantity });
    } else { // user is logged in
        const user = await User.findById(req.user._id).populate("cart");
        populatedCart = user.cart;
        // check if user already has some of this orderItem in their cart, if so, update the quantity. else add new orderItem
        for (const item of populatedCart) {
            if (item.product.equals(productId)) {
                const newQuantity = req.body.quantity;

                if (newQuantity === "0") return res.redirect(307, `/cart/items/${item._id}?_method=DELETE`);

                const orderItem = await OrderItem.findByIdAndUpdate(item._id, { quantity: newQuantity });
                await orderItem.save();
                req.flash("flashSuccess", "Updated cart");
                return res.redirect("/cart");
            }
        }
        // product was not already in user cart so make new orderItem
        const orderItem = new OrderItem({
            author: user,
            product,
            quantity,
            productTitle: product.title,
            productPrice: product.price,
            productStillAvailable: true
        });

        user.cart.push(orderItem);
        await user.save();
        await orderItem.save();

        // add new orderItem to Product cartInstances
        product.cartInstances.push(orderItem);
        await product.save();
    }

    res.redirect("/cart");
}));

// delete orderItem from cart
userRouter.delete("/cart/items/:itemId", asyncWrapper(async (req, res, next) => {
    // note that we have access to productId of the orderItem via a hidden input in the product show and cart show view

    // if user is not logged in, remove from session "cart"
    if (!req.user) {

        // filter out the item in the cart which was passed in via the hidden input ie the one the user wants to remove
        req.session.cart = req.session.cart.filter(item => item.product._id !== req.body.productId);
        req.flash("flashSuccess", "REMOVED ITEM FROM CART")

        return res.redirect("/cart");
    }

    const { itemId } = req.params;
    const orderItem = await OrderItem.findById(itemId);
    if (!itemId) throw new SmartError(500, "Order item not found, could not remove");

    // we know user is logged in so remove reference of orderItem from their cart attribute
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, { $pull: { cart: itemId } });

    // delete orderItem from Product's cartInstances array
    const productId = orderItem.product; // .product is a product id, not the whole product
    await Product.findByIdAndUpdate(productId, { $pull: { cartInstances: itemId } });

    await orderItem.remove();

    res.redirect("/cart");
}));

userRouter.get("/checkout", isLoggedIn, hasItemInCart, (req, res, next) => {
    res.render("users/checkout");
});


userRouter.post("/orders", isLoggedIn, hasItemInCart, asyncWrapper(async (req, res, next) => {
    const formInfo = req.body;
    const user = await User.findById(req.user._id).populate({
        path: "cart",
        populate: {
            path: "product"
        }
    });

    // create shipping address instance
    let shippingAddressInfo = {
        author: user,
        line1: req.body["shipping-line-1"],
        line2: req.body["shipping-line-2"] || "",
        city: req.body["shipping-city"],
        hasState: req.body["shipping-has-state"] || false,
        state: req.body["shipping-state"] || null,
        zip: req.body["shipping-zip"],
        country: req.body["shipping-country"]
    };

    const shippingAddress = new Address(shippingAddressInfo);

    // create payment method instance
    let paymentMethodInfo = {
        author: user,
        nameOnCard: req.body["card-name"],
        cardNumber: req.body["card-number"],
        expMonth: req.body["card-exp-month"],
        expYear: req.body["card-exp-year"],
        cvc: req.body["card-cvc"]
    };
    const paymentMethod = new PaymentMethod(paymentMethodInfo);

    // create billing address instance (if different from shipping)
    let billingAddressInfo;
    if (req.body["use-shipping-twice"]) { billingAddressInfo = shippingAddressInfo; }
    else {
        billingAddressInfo = {
            author: user,
            line1: req.body["billing-line-1"],
            line2: req.body["billing-line-2"],
            city: req.body["billing-city"],
            hasState: req.body["billing-has-state"] || false,
            state: req.body["billing-state"] || null,
            zip: req.body["billing-zip"],
            country: req.body["billing-country"]
        };
    }

    const billingAddress = new Address(billingAddressInfo);

    await shippingAddress.save();
    await paymentMethod.save();
    await billingAddress.save();

    // go through all orderItems in card and...
    // 1. add them to items array in Order instance
    // 2. add up the prices to get the subtotal
    // 3. delete orderItem from user.cart
    // 4. delete qty of item from product listing (if user bought 3 of an item, there is 3 less available)
    // 5. move from product.cartInstances to orderInstances

    const order = new Order({
        author: user,
        shippingAddress,
        paymentMethod,
        billingAddress
    });

    order.subtotal = 0;
    for (const orderItem of user.cart) {
        order.items.push(orderItem);

        order.subtotal += orderItem.product.price * orderItem.quantity;

        // filters out orderItem from product's cartInstances array and add to orderInstance array
        const product = await Product.findByIdAndUpdate(orderItem.product._id, {
            inStock: orderItem.product.inStock - orderItem.quantity,
            $pull: { cartInstances: orderItem }
        });

        if (product.orderInstances === undefined) product.orderInstances = [];
        product.orderInstances.push(orderItem); // probably a query for this

        await product.save();
    }

    // clear user cart
    user.cart = [];

    // add 6.25 sales tax
    order.tax = order.subtotal * .0625;
    order.total = order.subtotal + order.tax;


    await order.save();

    // add order to User.orders
    if (user.orders === undefined) user.orders = [];
    user.orders.push(order);

    await user.save();

    console.log("CONFUSING...");

    res.redirect(`/orders/${order._id}`);
}));

// orders index page
userRouter.get("/orders", isLoggedIn, asyncWrapper(async (req, res, next) => {
    const populatedUser = await User.findById(req.user._id).populate({
        path: "orders",
        populate: {
            path: "items"
        }
    });
    const orders = populatedUser.orders;
    res.render("orders/index", { orders });
}));

// order show page
// ownsOrder middleware also checks that order exists s oo no need to validate that  
userRouter.get("/orders/:orderId", isLoggedIn, ownsOrder, asyncWrapper(async (req, res, next) => {
    console.log("very interesting stuff");
    res.locals.order = await Order.findById(req.params.orderId).populate("items");
    res.render("orders/show");
}));

module.exports = userRouter;