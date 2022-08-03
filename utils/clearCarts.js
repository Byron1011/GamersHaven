// const asyncWrapper = require("./asyncWrapper");
// const Product = require("../Models/product");
// const Review = require("../Models/review");
// const User = require("../Models/user");
// const OrderItem = require("../Models/orderItem");

// const clearCarts = async () => {
//     console.log("CLEARLING ALL CARTS...");
//     const users = await User.find({}).populate("cart");

//     for (const user of users) {
//         for (const cartItem of user.cart) {
//             await User.findByIdAndUpdate(user._id, { $pull: { cart: cartItem } });
//             await User.save();
//         }
//     }

//     console.log("ALL DONE :)");
// }

// module.exports = clearCarts;