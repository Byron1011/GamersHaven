const Joi = require("joi");

const productJoiSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
    inStock: Joi.number().required().min(1),
});

module.exports = productJoiSchema;