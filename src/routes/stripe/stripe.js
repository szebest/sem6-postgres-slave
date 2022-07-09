const axios = require('axios')
const express = require('express');
router = express.Router();

const stripe = require('../../stripe')

const prisma = require('../../prismaClient')

router.post('/', async (req, res) => {
    // #swagger.summary = 'Used for receiving information about stripe webhook events'
    console.log('Processing stripe request')
    const payload = req.body
    const sig = req.headers['stripe-signature']
    const endpoint_secret = process.env.NODE_ENV === 'development' ? 
        process.env.WEBHOOK_SECRET_LOCAL :
        process.env.WEBHOOK_SECRET_PRODUCTION

    let event
    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpoint_secret)
        console.log(`Received stripe event: ${event.type}`)
        console.log('Metadata attached:')
        console.log(event.data.object.metadata)
        if (event.type === 'charge.succeeded') {
            if (event.data.object.metadata?.type === "RESERVATION_PAYMENT") {
                const transactionData = await axios.get(`https://api.stripe.com/v1/balance_transactions/${event.data.object.balance_transaction}`, {
                    headers: {
                        authorization: `Bearer ${process.env.STRIPE_SECRET}`
                    }
                })

                const updated = prisma.reservation.update({
                    where: {
                        id: parseInt(event.data.object.metadata?.reservation_id)
                    },
                    data: {
                        payment_status: 'paid',
                        receipt_URL: event.data.object.receipt_url,
                        amount_paid: transactionData.data.amount / 100,
                        net_received: transactionData.data.net / 100
                    }
                })

                console.log(updated)
            }
        }
        else if (event.type === 'payment_intent.canceled') {
            const reservation_id = parseInt(event.data.object.metadata?.reservation_id)
            await prisma.reservation.delete({
                where: {
                    id: isNaN(reservation_id) ? undefined : reservation_id
                }
            })
        }

        return res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;