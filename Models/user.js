const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem"
    }],
    addresses: [{
        type: Schema.Types.ObjectId,
        ref: "OrderItem"
    }],
    paymentMethods: [{
        type: Schema.Types.ObjectId,
        ref: "PaymentMethod"
    }],
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
});

// this tells passportLocalMongoose to add stuff to our user Scehma such as a username, hash, salt, etc.
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);