"use strict"
const createError = require('http-errors')
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const apiRouter = require('./routes/api')
require('dotenv').config()

mongoose.set('strictQuery', false)

main().catch(err => console.log(err))
async function main() {
  await mongoose.connect(process.env.MONGO_URI)
}

app.use(logger("dev"))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api', apiRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})
// // error handler
app.use((err, req, res, next) => {
  const { message } = err
  // set locals, only providing error in development
  res.locals.message = message
  res.locals.error = req.app.get("env") === "development" ? err : {}
  // render the error page
  res.status(err.status || 500)
  res.send(message || 'Internal Server Error')
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

module.exports = app
