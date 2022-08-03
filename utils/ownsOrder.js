const asyncWrapper = require("./asyncWrapper");
const Order = require("../Models/order");
const User = require("../Models/user");
const SmartError = require("./SmartError");


const ownsOrder = asyncWrapper(async (req, res, next) => {
    console.log("walahi i am a genius");

    // check if id belongs to an actual order
    const order = await Order.findById(req.params.orderId);
    if (!order) next(new SmartError(500, `could not find an order with id ${req.params.orderId}`));

    // check order.author is the same as the logged in user
    const populatedUser = await User.findById(req.user._id).populate({
        path: "orders",
        populate: {
            path: "author"
        }
    });
    const { orders } = populatedUser;

    if (order.author._id.equals(populatedUser._id)) next();
    else next(new SmartError(500, "You do not own that order"));

    // also finally implement returnto
});

module.exports = ownsOrder;