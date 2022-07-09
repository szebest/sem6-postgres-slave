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
                console.log("RESERVATION_PAYMENT")
                
                const updated = await prisma.reservation.update({
                    where: {
                        id: parseInt(event.data.object.metadata?.reservation_id)
                    },
                    data: {
                        payment_status: 'paid',
                        receipt_URL: event.data.object.receipt_url,
                        amount_paid: event.data.object.amount / 100,
                        net_received: event.data.object.transfer_data.amount / 100
                    }
                })
            }
            else if (event.data.metadata?.type === "EXCESS_PAYMENT") {
                console.log("EXCESS_PAYMENT")

                const updated = await prisma.reservation.update({
                    where: {
                        id: parseInt(event.data.object.metadata?.reservation_id)
                    },
                    data: {
                        amount_paid: {
                            increment: event.data.object.amount / 100
                        },
                        net_received: {
                            increment: event.data.object.transfer_data.amount / 100
                        },
                        excess_payment: 0
                    }
                })
            }
        }
        else if (event.type === 'payment_intent.canceled') {
            if (event.data.object.metadata?.type === "RESERVATION_PAYMENT") {
                const reservation_id = parseInt(event.data.object.metadata?.reservation_id)
                await prisma.reservation.delete({
                    where: {
                        id: isNaN(reservation_id) ? undefined : reservation_id
                    }
                })
            }
        }

        return res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;