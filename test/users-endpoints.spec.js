const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe.only('Users endpoints', function() {
  let db

  const { testUsers } = helpers.makeThingsFixtures()
  const testUser = testUsers[0]
  console.log('testUser',testUser)

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  console.log(process.env.TEST_DB_URL)

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () => 
        helpers.seedUsers(
          db,
          testUsers,
        )  
      )
      const requiredFields = ['user_name', 'full_name', 'password']

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          full_name: 'test full_name',
          password: 'test password',
          nickname: 'test nickname',
        }

        it(`responds with 400 required error when ${field} is missing`, () => {
          delete registerAttemptBody[field]

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing ${field} in request body`,
            })
        })
      })

      it(`responds 400 and 'Password must be longer than 8 characters' when password short`, () => {
        const userShortPassword = {
          user_name: 'test user_name',
          password: '1234567',
          full_name: 'test full_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(userShortPassword)
          .expect(400, {
            error: `Password must be at least 8 characters`,
          })
      })
  

    it(`responds 400 and 'Password must be less than 73 characters' when password long`, () => {
      const userLongPass = {
        user_name: 'test user_name',
        password: '*'.repeat(73),
        full_name: 'test full_name',
      }

      return supertest(app)
        .post('/api/users')
        .send(userLongPass)
        .expect(400, {
          error: `Password must be less than 73 characters`,
        })
    })

    it(`responds 400 error when password starts with spaces`, () => {
      const userPasswordStartsSpaces = {
        user_name: 'test user_name',
        full_name: 'test full_name',
        password: ' 12345678',
      }

      return supertest(app)
        .post('/api/users')
        .send(userPasswordStartsSpaces)
        .expect(400, {
          error: `Password must not start or end with spaces`
        })
    })

    it(`responds 400 error when password ends with spaces`, () => {
      const userPasswordEndsSpaces = {
        user_name: 'test user_name',
        full_name: 'test full_name', 
        password: '12345678 ',
      }

      return supertest(app)
        .post('/api/users')
        .send(userPasswordEndsSpaces)
        .expect(400, {
          error: `Password must not start or end with spaces`
        })
    })

    it(`responds 400 error when password isn't complex enough`, () => {
      const userPasswordNotComplex = {
        user_name: 'test user_name',
        full_name: 'test full_name',
        password: '11AAaabb',
      }
      return supertest(app)
        .post('/api/users')
        .send(userPasswordNotComplex)
        .expect(400, {
          error: `Password must contain 1 upper case, lower case, number and special character`,
        })
    })

    it(`responds 400 'User name already taken' when user_name isn't unique`, () => {
      const duplicateUser = {
        user_name: testUser.user_name,
        password: '11AAaa!!',
        full_name: 'test full_name',
      }

      return supertest(app)
        .post('/api/users')
        .send(duplicateUser)
        .expect(400, {
          error: `Username already taken` 
        })
      })
    })

    context(`Happy path`, () => {
      it(`responds 201, serialized user, storing bcrypted password`, () => {
        const newUser = {
          user_name: 'test user_name',
          full_name: 'test full_name',
          password: 'AAaa11!!',
        }
        return supertest(app)
          .post('/api/users')
          .send(newUser)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property('id')
            expect(res.body.user_name).to.eql(newUser.user_name)
            expect(res.body.full_name).to.eql(newUser.full_name)
            expect(res.body.nickname).to.eql('')
            expect(res.body).to.not.have.property('password')
            expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
            const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
            const actualDate = new Date(res.body.date_created).toLocaleString()
            expect(actualDate).to.eql(expectedDate)
          })
      })
    })
  })
})
