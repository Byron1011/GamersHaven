const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentMethod = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    nameOnCard: String,
    cardNumber: Number,
    expMonth: Number,
    expYear: Number,
    cvc: Number
});

module.exports = mongoose.model('PaymentMethods', PaymentMethod);