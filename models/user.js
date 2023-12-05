const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
  given_name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  family_name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: false,
    minlength: 5,
    maxlength: 1024,
  },
  passport: {
    type: Boolean,
    required: true,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      isVerified: this.isVerified,
      given_name: this.given_name,
      family_name: this.family_name,
      email: this.email,
      isAdmin: this.isAdmin,
      isVerified: this.isVerified,
    },
    process.env.jwtPrivateKey
  );
};

function validateUser(user) {
  const schema = Joi.object({
    given_name: Joi.string().min(2).max(50).required(),
    family_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(user);
}

function validateLogin(user) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(user);
}

const User = mongoose.model("User", userSchema);

exports.User = User;
exports.validate = validateUser;
exports.validateLogin = validateLogin;
