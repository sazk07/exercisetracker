"use strict"

const Users = require('../models/users')
const Exercises = require('../models/exercises')
const router = require('express').Router()
const asyncHandler = require('express-async-handler')
const { body, validationResult } = require('express-validator')
const User = require('../models/users')
const Exercise = require('../models/exercises')
const { parse } = require('dotenv')

// get response on users
const users_get = async(req, res, next) => {
  const users = await Users.find({})
  res.json(users)
}

// validate and sanitize username input
function createUsernameChain() {
  return body("username")
    .trim()
    .escape()
    .isAlphanumeric()
    .withMessage("username must be alphabet or numbers")
}

// post response on users
const users_post = async(req, res, next) => {
  // extract validation errors from a req
  const validationErrors = validationResult(req)
  const username = new User({
    username: req.body.username
  })
  if (!validationErrors.isEmpty()) {
    // there are errors. redirect to form again
    res.json({
      error: validationErrors.array()
    })
    return
  } else {
    // data from Form is valid
    // check if username already exists
    const usernameExists = await User.findOne({
      username: req.body.username
    }).exec()
    if (usernameExists) {
      res.send({ error: 'username already exists' })
    } else {
      await username.save()
      res.json({
        username: username.username,
        _id: username._id
      })
    }
  }
}

// validate and sanitize exercises_post
function createExerciseChain() {
  return body('_id')
  .isMongoId()
  .withMessage("ID must be in proper format"),
  body("description")
  .trim(),
  body("duration")
  .trim()
  .toInt(),
  body("date")
  .optional({ values: 'falsy'})
  .isISO8601()
  .toDate()
}
// send exercises
const exercises_post = async(req, res, next) => {
  const { userId } = req.params
  const { description, duration, date } = req.body
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    res.json({
      error: validationErrors.array()
    })
    return
  } else {
    const userIdExists = await Users.findById(userId).exec()
    if (!userIdExists) {
      res.status(400).send({ error: "ID not found" })
    } else {
      // get username
      const username = await User.findOne({
        _id: userId
      }, 'username').exec()
      // save record
      const exercise = new Exercise({
        description: description,
        duration: duration,
        date: date,
        username: username.username,
        userId: userId
      })
      await exercise.save()
      const dateString = exercise.date.toDateString()
      res.json({
        _id: exercise.userId,
        description: exercise.description,
        duration: exercise.duration,
        date: dateString,
        username: exercise.username
      })
    }
  }
}

// send logs
const logs_get = async(req, res, next) => {
  const { userId } = req.params
  const { from, to, limit } = req.query
  // cast from and to to Date objects
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const limitInt = parseInt(limit)

  try {
  const [recordResult, count] = await Promise.all([
    // find record
    Exercise.find({ userId: userId }, 'userId description duration username date', {
      date: { $gte: fromDate, $lte: toDate },
      limit: limitInt
    }).exec(),
    // count documents
    Exercise.countDocuments({
      userId: userId
    }).exec()
  ])
    const mappedLogsArray = recordResult.map((item) => {
      return { duration: item.duration,
        description: item.description,
        date: item.date.toDateString()
      }
    })
    res.json({
      username: recordResult[0].username,
      _id: recordResult[0].userId,
      count: count,
      logs: mappedLogsArray
    })
  } catch (error) {
    next()
  }
}

router.get('/users', asyncHandler(users_get))
router.post('/users', createUsernameChain(), asyncHandler(users_post))
router.post('/users/:userId/exercises', createExerciseChain(), asyncHandler(exercises_post))
router.get('/users/:userId/logs', asyncHandler(logs_get))

module.exports = router
