const SmartError = require("./SmartError");

const asyncWrapper = function (func) {
    return function (req, res, next) {
        func(req, res, next).catch(err => next(new SmartError(500, err.message)));
    }
}

module.exports = asyncWrapper;