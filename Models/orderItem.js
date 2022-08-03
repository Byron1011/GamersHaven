const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItem = new Schema({
    // saving some information because a product may get deleted but will still show up in order history
    // in this case, the boolean tells us if product has been deleted / is out of stock or not
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    productTitle: String,
    productPrice: Number,
    productStillAvailable: {
        type: Boolean,
        default: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },
    quantity: Number
});

module.exports = mongoose.model('OrderItem', OrderItem);