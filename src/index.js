const express = require('express')
const app = express()
const PORT = process.env.PORT ?? 4000

const bodyParser = require('body-parser')

const routes = require('./routes')

const cors = require('cors')

const { connect } = require('./socket')

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('../swagger-output.json')
const prisma = require('./prismaClient')
const stripe = require('./stripe')

if (process.env.NODE_ENV === 'development') {
  swaggerFile.host = "localhost:" + PORT
}
else {
  swaggerFile.host = "sem6-postgres-slave1.herokuapp.com"
  swaggerFile.schemes = [
    'https',
    'http'
  ]
}

app.enable('trust proxy');

app.use(cors({
  origin: '*'
}));

app.use('/api/v1/stripe', bodyParser.raw({type: "*/*"}))
app.use(bodyParser.json())

app.use('/api/v1', routes)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile))

const server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

setInterval(async () => {
  const date = new Date()
  // ~15 minutes for the transaction to complete by the user
  date.setMinutes(date.getMinutes() - 15)
  console.log(`Cleaning up transactions created after: ${date.toISOString()}, which were not finished`)
  const res = await prisma.reservation.findMany({
    where: {
      created_at: {
        lte: date.toISOString()
      },
      payment_status: 'created'
    }
  })

  if (res.length > 0) {
    res.forEach((reservation) => {
      const intent = reservation.payment_intent
      stripe.paymentIntents.cancel(intent);

      console.log(`Invalidated ${intent} intent`)
    })


    await prisma.reservation.deleteMany({
      where: {
        id: {
          in: res.map((reservation) => reservation.id)
        }
      }
    })
  }

  console.log(`Removed ${res.length} unfinished transactions`)
}, 1000 * 60)

connect(server)