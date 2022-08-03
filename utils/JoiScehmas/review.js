const Joi = require("joi");

const reviewJoiSchema = Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    score: Joi.number().required().min(1).max(5),
});

module.exports = reviewJoiSchema;