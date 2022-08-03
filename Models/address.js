const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Address = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    line1: String,
    line2: String,
    city: String,
    hasState: Boolean,
    state: String,
    zip: Number,
    country: String,
});

module.exports = mongoose.model('Address', Address);