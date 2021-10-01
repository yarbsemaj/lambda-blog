const Joi = require('joi');

exports.default = Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    status: Joi.string().allow('draft', 'published').required(),
    image: Joi.string().required(),
    description: Joi.string().required(),
})