const bcrypt = require('bcryptjs')

const AuthService = {
  getUserByUserName(db, user_name) {
    return db('thingful_users')
      .where({ user_name })
      .first()
  },
  comparePasswords(password, hash) {
    return bcrypt.compare(password, hash)
  },
}

module.exports = AuthService