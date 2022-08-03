const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    title: String,
    body: String,
    score: Number,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    fromAuthenticCustomer: Boolean
});

const ReviewModel = new mongoose.model("Review", reviewSchema);

module.exports = ReviewModel;