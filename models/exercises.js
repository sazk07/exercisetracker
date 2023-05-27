"use strict"

const mongoose = require('mongoose')
const { Schema } = mongoose

const ExerciseSchema = new Schema({
  description: {
    type: String,
    required: [true, "Please input description"],
    maxLength: [120, "description too long"],
  },
  duration: {
    type: Number,
    required: [true, "Please input duration"],
    min: [1, 'duration too short'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  username: String,
  userId: {
    type: String,
    ref: 'Users',
    index: true,
  },
})
// add date if not specified
ExerciseSchema.pre('save', (next) => {
  if(!ExerciseSchema.date) {
    ExerciseSchema.date = Date.now()
  }
  next()
})

ExerciseSchema.virtual("url").get(function () {
  return `/api/users/${this._id}/exercises`
})

ExerciseSchema.virtual("url2").get(function () {
  return `/api/users/${this._id}/logs`
})

const Exercise = mongoose.model('Exercise', ExerciseSchema)

module.exports = Exercise
