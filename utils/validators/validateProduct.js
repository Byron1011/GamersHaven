const productJoiSchema = require("../JoiScehmas/product");
const SmartError = require("../SmartError");

const validateProduct = async (req, res, next) => {
    const result = productJoiSchema.validate(req.body);

    // if there is no error continue onto next middleware
    if (!result.error) return next();

    let errorMessage = "";
    // combine all error messages into one string separated by newline characters ("\n")
    for (let i = 0; i < result.error.details.length; i++) {
        errorMessage = errorMessage.concat(result.error.details[i].message);

        // always add a new line after adding a message unless the current message is the last one in the array
        if (i === result.error.details.length - 1) continue;
        else errorMessage = errorMessage.concat("\n");
    }

    next(new SmartError(500, errorMessage));
};

module.exports = validateProduct;