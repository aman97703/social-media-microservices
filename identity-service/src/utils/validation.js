const joi = require("joi");

const validationRegistration = (data) => {
  const schema = joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().min(6).max(100).required(),
    email: joi.string().email().required(),
  });

  return schema.validate(data);
};

const validationLogin = (data) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });

  return schema.validate(data);
};

module.exports = { validationRegistration, validationLogin };
