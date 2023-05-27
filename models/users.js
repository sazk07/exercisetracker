"use strict"

const mongoose = require('mongoose')
const { Schema } = mongoose

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    maxLength: [30, 'username too long']
  }
})

const User = mongoose.model('User', UserSchema)

module.exports = User
