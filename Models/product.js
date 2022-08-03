// this is a LISTING aka qty here refers to amount in stock not purchased. An instance of the Purchase model must refer to
// one of these Products, and many Purchases can refer to the same Product

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    inStock: Number,
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    // save all orderItems in cart so if this product gets deleted, we can also delete the orderItem in the cart
    cartInstances: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem"
    }],
    // in case product gets deleted, the ordered orderItems (as opposed to cart orderItems) will be updated so
    // that productStillAvailable is false
    orderInstances: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem"
    }]
});

const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;