const knex = require('knex')
const helpers = require('./test-helpers')
const app = require('../src/app')

describe.only('Auth endpoints', () => {
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
          .expect(400, {
            error: `Missing ${field} in request body`,
          })
      })
    })
  })
})