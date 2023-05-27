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
    .isLength({min: 3})
    .escape()
    .withMessage("username must be atleast 3 characters long")
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
    })
      .exec()
    usernameExists ? res.send({ error: 'username already exists' })
      :
    await username.save()
    res.json({
      username: username.username,
      _id: username._id
    })
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
  const { _id, description, duration, date } = req.body
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
        userId: _id,
        description: description,
        duration: duration,
        date: date,
        username: username.username
      })
      await exercise.save()
      const dateString = exercise.date.toDateString()
      res.json({
        _id: exercise._id,
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

  const [recordResult, count] = await Promise.allSettled([
    // find record
    Exercise.find({ _id: userId }, '_id description duration username date', {
      date: { $gte: fromDate, $lte: toDate },
      limit: limitInt
    }).exec(),
    // count documents
    Exercise.countDocuments({
      _id: userId
    }).exec()
  ])
  if (recordResult === null || count === null) {
    // No results
    const err = new Error("No record found")
    err.status = 404
    return next(err)
  }

  const mappedLogsArray = recordResult.map((item) => {
    return { duration: item.duration,
      description: item.description,
      date: item.date.toDateString(), }
  })

  res.json({
    username: recordResult[0].username,
    _id: recordResult[0]._id,
    count: count,
    logs: mappedLogsArray
  })
}

router.get('/users', asyncHandler(users_get))
router.post('/users', createUsernameChain(), asyncHandler(users_post))
router.post('/users/:userId/exercises', createExerciseChain(), asyncHandler(exercises_post))
router.get('/users/:userId/logs', asyncHandler(logs_get))

module.exports = router
