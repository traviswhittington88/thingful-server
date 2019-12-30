require('dotenv').config()

const { expect } = require('chai')
const supertest = require('supertest')

process.env.TZ = 'UTC'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_EXPIRY = '3m'
process.env.TEST_DB_URL = process.env.TEST_DB_URL || "postgresql://thingful@localhost/thingful-test"

global.expect = expect
global.supertest = supertest
