const express = require('express')
const UsersService = require('../users/users-service')

const usersRouter = express.Router()
const jsonBodyParser = express.json()

usersRouter
  .post('/', jsonBodyParser, (req, res, next) => {
    const { user_name, full_name, password } = req.body
    const newUser = { user_name, full_name, password }

    for (const field of ['user_name', 'full_name', 'password']) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Missing ${field} in request body`,
        })
      }
    }

    const passwordError = UsersService.verifyPassword(password)

    if (passwordError) {
      return res.status(400).json({
        error: passwordError
      })
    }

    UsersService.hasUserWithUserName(
      req.app.get('db'),
      user_name
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName) {
          return res.status(400).json({
            error: `Username already taken`
          })
        }
        res.send('ok')
      })
      .catch(next)
  })

module.exports = usersRouter