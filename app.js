const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'goodreads.db')
const bcrypt = require('bcrypt')

let db = null

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()

//REGISTER API
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashpassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `select * from user where username='${username}'`
  const dbuser = await db.get(selectUserQuery)
  if (dbuser === undefined) {
    passlength = password.length
    if (passlength >= 5) {
      const InsertQuery = `INSERT into user (username,name,password,gender,location)
      VALUES('${username}','${name}','${hashpassword}','${gender}','${location}');`;
      await db.run(InsertQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//LOGIN
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `select * from user where username='${username}'`
  const dbuser = await db.get(selectUserQuery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispasswordcorrect = await bcrypt.compare(password, dbuser.password)
    if (ispasswordcorrect === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//Update
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `select * from user where username='${username}'`
  const dbuser = await db.get(selectUserQuery)
  const ispasswordcorrect = await bcrypt.compare(oldPassword, dbuser.password)
  if (ispasswordcorrect === true) {
    if (newPassword.length >= 5) {
      const hashpassword = await bcrypt.hash(newPassword, 10)
      const updateQuery = `UPDATE user set password='${hashpassword}' where username='${username}';`
      await db.run(updateQuery)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
