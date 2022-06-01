const crypto = require("crypto");
const mongoose = require("mongoose");
const Schema = mongoose.Schema; 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

var userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      trim: true,
      select: false, // while making a request don't return the password only if adding it to select +password
    },
    lastName: {type: String,required: true},
    firstName: {type: String,required: true},
    phoneNumber: {type: String,required: true},
    address: String,
    town: String,
    role: {
      type: String,
      enum: ["ADMIN", "CLIENT"],
      default: "CLIENT",
      required: true,
    },
    isActive: {type: Boolean,default: true},
    acceptTerms: Boolean, 
    verified: Date, 
    verificationToken: String,
    passwordReset: Date, 
    resetToken: { token: String, expires: Date},
    createdAt: {type: Date,default: Date.now},
    lastLoginDate: Date,
    updatedAt: Date, 
  }
);

userSchema.virtual('isVerified').get(function () {
  return !!(this.verified || this.passwordReset);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  //Assigning the id od the user to our JWT
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};


module.exports = mongoose.model("User", userSchema);