const knex = require('knex')
const jwt = require('jsonwebtoken')
const helpers = require('./test-helpers')
const app = require('../src/app')

describe('Auth endpoints', () => {
  let db

  const { testUsers } = helpers.makeThingsFixtures()
  const testUser = testUsers[0]

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () => 
      helpers.seedUsers(
        db,
        testUsers
      )
    )

    const requiredFields = ['user_name', 'password']

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password,
      }

      it(`Responds with 400 required error when ${field} is missing`, () => {
        delete loginAttemptBody[field]

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          })
      })

      it(`Responds 400 'Incorrect user_name or password' when bad user_name`, () => {
        const userInvalidUserName = { user_name: 'wrongwrongUser', password: testUser.password }
        return supertest(app)
          .post('/api/auth/login')
          .send(userInvalidUserName)
          .expect(400, {
            error: `Incorrect user_name or password`
          })
      })

      it(`Responds 400 'Incorrect user_name or password' when bad password`, () => {
        const userInvalidPass = { user_name: testUser.user_name, password: 'incorrect' }
        return supertest(app)
          .post('/api/auth/login')
          .send(userInvalidPass)
          .expect(400, {
            error: `Incorrect user_name or password`
          })
      })

      it(`Responds 200 and JWT auth token using secret when valid creds`, () => {
        const userValidCreds = {
          user_name: testUser.user_name,
          password: testUser.password,
        }
        const expectedToken = jwt.sign(
          { user_id: testUser.user_id },
            process.env.JWT_SECRET,
          { subject: testUser.user_name,
            algorithm: 'HS256',
          }
        )
      })
    })
  })
})