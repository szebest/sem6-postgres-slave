const express = require('express')
const app = express()
const PORT = process.env.PORT ?? 4000

const bodyParser = require('body-parser')

const routes = require('./routes')

const { connect } = require('./socket')

app.use(bodyParser())
app.use('/api/v1', routes)

const server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

connect(server)