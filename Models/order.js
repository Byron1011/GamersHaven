const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Order = new Schema({
    // TODO ITEMS ORDERED
    items: [{
        type: Schema.Types.ObjectId,
        ref: "OrderItem"
    }],
    date: {
        type: Date,
        default: Date.now
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: "Address"
    },
    billingAddress: {
        type: Schema.Types.ObjectId,
        ref: "Address"
    },
    paymentMethod: {
        type: Schema.Types.ObjectId,
        ref: "PaymentMethod"
    },
    orderNumber: Number,
    subTotal: Number,
    tax: Number,
    total: Number

});

module.exports = mongoose.model('Order', Order);