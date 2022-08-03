const SmartError = require("./SmartError");

const hasItemInCart = async (req, res, next) => {
    const { cart } = req.user;
    if (cart.length > 0) next();
    else next(new SmartError(500, "must have at least one item in cart to checkout"));
};

module.exports = hasItemInCart;