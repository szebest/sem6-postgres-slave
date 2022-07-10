const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const axios = require('axios')

const stripe = require('../../stripe')

const { isAtLeastServerAdminValidator, isLoggedInValidator, isSpecificUserValidator, hasUserValues } = require('../../middlewares/authorization');
const { reservationValidator, reservationUpdateValidator } = require('../../middlewares/validators');
const { checkOverlaps, reservationPriceCalculator } = require('../../util/');
const { reservationToDatesArray } = require('../../mappers');

router.get('/', isAtLeastServerAdminValidator, hasUserValues, async (_, res) => {
    // #swagger.summary = 'Returns all the reservations made on the server. User has to be at least an owner'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */
    try {
        const allReservations = (await prisma.reservation.findMany()).map((reservation) => {
            return {
                ...reservation,
                net_received: +reservation.net_received,
                amount_paid: +reservation.amount_paid,
                excess_payment: +reservation.excess_payment
            }
        })

        const currentDate = new Date()

        const dateOneWeekBefore = new Date()
        dateOneWeekBefore.setUTCDate(dateOneWeekBefore.getDate() - 7)

        const reservationsCreatedInTheLastWeek = allReservations.filter((reservation) => {
            return reservation.created_at >= dateOneWeekBefore
        })

        const amountUsersPaidLastWeek = reservationsCreatedInTheLastWeek.map((reservation) => {
            return reservation.amount_paid
        }).reduce((previousValue, currentValue) => {
            return +previousValue + +currentValue ?? 0
        })

        const netValueReceivedLastWeek = reservationsCreatedInTheLastWeek.map((reservation) => {
            return reservation.net_received
        }).reduce((previousValue, currentValue) => {
            return +previousValue + +currentValue ?? 0
        })

        const reservationsActiveInTheLastWeek = allReservations.filter((reservation) => {
            return reservation.payment_status !== 'created' && checkOverlaps(reservationToDatesArray([reservation]), {
                start: dateOneWeekBefore,
                end: currentDate
            }).length > 0
        })

        const daysEnum = {
            1: "MONDAY",
            2: "TUESDAY",
            3: "WEDNESDAY",
            4: "THURSDAY",
            5: "FRIDAY",
            6: "SATURDAY",
            0: "SUNDAY"
        }

        const days = {
            MONDAY: Array(24).fill(0),
            TUESDAY: Array(24).fill(0),
            WEDNESDAY: Array(24).fill(0),
            THURSDAY: Array(24).fill(0),
            FRIDAY: Array(24).fill(0),
            SATURDAY: Array(24).fill(0),
            SUNDAY: Array(24).fill(0)
        }

        reservationsActiveInTheLastWeek.forEach((reservation) => {
            const startingDate = reservation.reserved_from < dateOneWeekBefore ? dateOneWeekBefore : reservation.reserved_from
            const endingDate = reservation.reserved_to > currentDate ? currentDate : reservation.reserved_to
            let flag = true
            let amount = 1
            while (flag) {
                const hour = startingDate.getUTCHours()
                const day = startingDate.getUTCDay()

                days[daysEnum[day]][hour] += 1

                startingDate.setUTCHours(hour + 1)

                if ((startingDate.getUTCHours() > endingDate.getUTCHours() && 
                    startingDate.getUTCDate() === endingDate.getUTCDate()) || amount >= 7 * 24) flag = false;

                amount++
            }
        })

        return res.json({
            allReservations,
            amountUsersPaidLastWeek,
            netValueReceivedLastWeek,
            reservationsCreatedLastWeek: reservationsCreatedInTheLastWeek.length,
            reservationsActiveLastWeek: reservationsActiveInTheLastWeek.length,
            lastWeekStatistics: days
        }).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/user/:id', isSpecificUserValidator, hasUserValues, async (req, res) => {
    // #swagger.summary = 'Returns all the reservations made by a specific user. Has to be at least the specific user'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['id'] = {
                in: 'path',
                description: 'Id of the user',
                "type": "integer"
    } */
    const user_id = parseInt(req.params.id)
    if (isNaN(user_id)) {
        return res.sendStatus(400)
    }
    try {
        const allUserReservations = await prisma.reservation.findMany({
            where: {
                user_id
            },
            orderBy: {
                created_at: {
                    sort: 'desc'
                }
            }
        })

        return res.json(allUserReservations).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/:id', isLoggedInValidator, hasUserValues, async (req, res) => {
    // #swagger.summary = 'Returns one reservation by the passed id. Has to be logged in'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['id'] = {
                in: 'path',
                description: 'Id of the reservation to get',
                "type": "integer"
    } */
    const id = +req.params.id
    if (isNaN(id)) {
        return res.sendStatus(400)
    }
    try {
        const reservation = await prisma.reservation.findUnique({
            where: {
                id
            }
        })

        if (reservation.user_id !== req.userId) {
            return res.sendStatus(403)
        }

        return res.json(reservation).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.delete('/:id', isAtLeastServerAdminValidator, hasUserValues, async (req, res) => {
    // #swagger.summary = 'Used for removing an reservation. Has to be at least an owner'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['id'] = {
                in: 'path',
                description: 'Id of the reservation to delete',
                "type": "integer"
    } */
    const id = +req.params.id
    if (isNaN(id)) {
        return res.sendStatus(400)
    }
    try {
        const deleted = await prisma.reservation.delete({
            where: {
                id
            }
        })

        return res.json(deleted).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.patch('/:id', reservationUpdateValidator, isAtLeastServerAdminValidator, async (req, res) => {
    // #swagger.summary = 'Used for updating an plate in the reservation. Has to be at least the server owner'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['id'] = {
                in: 'path',
                description: 'Id of the reservation to patch',
                "type": "integer"
    } */

    /*  #swagger.parameters['body'] = {
            "name": "body",
            "in": "body",
            "@schema": {
                "type": "object",
                "required": ['plate'],
                "properties": {
                    "plate": {
                        "example": "string",
                        "type": "string",
                    }
                }
            }
    } */
    const id = +req.params.id
    if (isNaN(id)) {
        return res.sendStatus(400)
    }
    try {
        const updated = await prisma.reservation.update({
            where: {
                id
            },
            data: {
                plate: req.body.plate
            }
        })

        return res.json(updated).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/', reservationValidator, isLoggedInValidator, hasUserValues, async (req, res) => {
    // #swagger.summary = 'Used for creating an reservation. User has to be logged in'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['body'] = {
            "name": "body",
            "in": "body",
            "@schema": {
                "type": "object",
                "required": ['reserved_from', 'reserved_to', 'user_id', 'plate'],
                "properties": {
                    "reserved_from": {
                        "example": "2022-06-16T15:03:09.385Z",
                        "type": "date",
                    },
                    "reserved_to": {
                        "example": "2022-06-16T15:03:09.385Z",
                        "type": "date",
                    },
                    "user_id": {
                        "example": 1,
                        "type": "integer",
                    },
                    "plate": {
                        "example": "string",
                        "type": "string",
                    }
                }
            }
    } */
    try {
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl + '/api/v1'

        const reserved_from = new Date(req.body.reserved_from)
        const reserved_to = new Date(req.body.reserved_to)
        const reservationDurationInHours = Math.round(((reserved_to - reserved_from) / (1000 * 60 * 60)) * 100) / 100
        // Min reservation length set to one hour
        if (reservationDurationInHours < 1) {
            return res.send({
                error: "RESERVATION_TOO_SHORT"
            }).status(400)
        }

        const allReservationsActive = await prisma.reservation.findMany({
            where: {
                reserved_to: {
                    gt: new Date().toISOString()
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        })

        const reservationsWithSamePlate = allReservationsActive.filter((reservationActive) => reservationActive.plate === req.body.plate)

        const overlapsSamePlateReservation = checkOverlaps(reservationToDatesArray(reservationsWithSamePlate), {
            start: new Date(req.body.reserved_from),
            end: new Date(req.body.reserved_to)
        })

        if (overlapsSamePlateReservation.length > 0 && overlapsSamePlateReservation.some((overlap) => {
            return overlap.overlap.end - overlap.overlap.start > 0
        })) {
            return res.send({
                info: "PLATE_RESERVATION_OVERLAPS",
                overlaps: {
                    ...overlapsSamePlateReservation[0].overlap
                }
            }).status(406)
        }

        const response = await axios
            .get('https://sem6-postgres-master.herokuapp.com/api/v1/slaves/parkingInformation', {
                params: {
                  server: process.env.NODE_ENV === 'development' ?
                    'http://sem6-postgres-slave1.herokuapp.com/api/v1' :
                    fullUrl
                }
              })
        
        const overlaps = checkOverlaps(reservationToDatesArray(allReservationsActive), {
            start: new Date(req.body.reserved_from),
            end: new Date(req.body.reserved_to)
        })

        const overlapObject = overlaps.find((overlap) => {
            return overlap.amount >= response.data.parking_spaces
        })

        if (overlapObject != null) {
            return res.send({
                info: "NOT_ENOUGH_FREE_PARKING_PLACES_LEFT",
                overlaps: {
                    ...overlapObject.overlap
                }
            }).status(406)
        }

        const customer = await axios
            .get(`https://sem6-postgres-master.herokuapp.com/api/v1/users/getEmailBySlave/${req.userId}`, {
                headers: {
                    authorization: `Bearer ${process.env.SLAVE_SECRET}`
                }
            })

        const created = await prisma.$transaction(async (prisma) => {
            const created = await prisma.reservation.create({
                data: {
                    reserved_from: reserved_from,
                    reserved_to: reserved_to,
                    user_id: req.userId,
                    plate: req.body.plate
                }
            })

            const priceInPLN = Math.round(reservationPriceCalculator(reservationDurationInHours, {
                amountPerHour: response.data.price_per_hour
            }) * 100)

            const minimalFee = priceInPLN - Math.round((1 + priceInPLN * 0.0005) * 100)

            const percentageFee = priceInPLN - Math.round(priceInPLN / 10)

            const actualFee = minimalFee > percentageFee ? percentageFee : minimalFee

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer_email: customer.data.email,
                payment_intent_data: {
                    metadata: {
                        type: "RESERVATION_PAYMENT",
                        reservation_id: created.id
                    },
                    transfer_data: {
                        destination: process.env.STRIPE_ACCOUNT_ID,
                        amount: actualFee
                    }
                },
                expires_at: Math.round((new Date().getTime()) / 1000) + 3600,
                line_items: [
                    {
                        price_data: {
                            currency: 'pln',
                            product_data: {
                                name: `Rezerwacja parkingu na ${reservationDurationInHours} godzin`
                            },
                            unit_amount: priceInPLN
                        },
                        quantity: 1
                    }
                ],
                mode: 'payment',
                success_url: 'http://localhost:3000/',
                cancel_url: 'http://localhost:3000/'
            })

            // const intent = await stripePayment({
            //     amount: reservationPriceCalculator(reservationDurationInHours, {
            //         amountPerHour: response.data.price_per_hour
            //     }) * 100,
            //     currency: 'pln',
            //     payment_method_types: ['card'],
            //     metadata: {
            //         type: "RESERVATION_PAYMENT",
            //         reservation_id: created.id
            //     },
            //     description: `Rezerwacja parkingu na ${reservationDurationInHours} godzin`
            // }, `{ORDER${created.id}}`)

            const updated = await prisma.reservation.update({
                where: {
                    id: created.id
                },
                data: {
                    payment_intent: session.payment_intent
                }
            })

            console.log("RESERVATION_PAYMENT")

            console.log(`Created new payment intent: ${session.payment_intent}`)

            console.log(`With session URL: ${session.url}`)

            return updated
        })

        return res.json(created).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/:id', reservationValidator, isLoggedInValidator, hasUserValues, async (req, res) => {
    // #swagger.summary = 'Used for paying excess_payment by the user. Used when the user stayed too long on a parking and got extra charged.'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['id'] = {
                in: 'path',
                description: 'Id of the reservation to pay excess_payment',
                "type": "integer"
    } */

    const id = +req.params.id
    if (isNaN(id)) {
        return res.sendStatus(400)
    }
    try {
        const reservation = await prisma.reservation.findFirst({
            where: {
                id,
                user_id: req.userId
            }
        })

        if (reservation === null) {
            return res.sendStatus(404)
        }

        if (reservation.excess_payment <= 0.01) {
            return res.sendStatus(422)
        }

        const customer = await axios
            .get(`https://sem6-postgres-master.herokuapp.com/api/v1/users/getEmailBySlave/${req.userId}`, {
                headers: {
                    authorization: `Bearer ${process.env.SLAVE_SECRET}`
                }
            })

        const priceInPLN = Math.round(reservation.excess_payment * 100)

        const minimalFee = priceInPLN - Math.round((1 + priceInPLN * 0.0005) * 100)

        const percentageFee = priceInPLN - Math.round(priceInPLN / 10)

        const actualFee = minimalFee > percentageFee ? percentageFee : minimalFee

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customer.data.email,
            payment_intent_data: {
                metadata: {
                    type: "EXCESS_PAYMENT",
                    reservation_id: reservation.id
                },
                transfer_data: {
                    destination: process.env.STRIPE_ACCOUNT_ID,
                    amount: actualFee
                }
            },
            expires_at: Math.round((new Date().getTime()) / 1000) + 3600,
            line_items: [
                {
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: 'Dopłata za pozostanie dłużej na parkingu'
                        },
                        unit_amount: priceInPLN
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: 'http://localhost:3000/',
            cancel_url: 'http://localhost:3000/'
        })

        console.log("EXCESS_PAYMENT")

        console.log(`Created new payment intent: ${session.payment_intent}`)

        console.log(`With session URL: ${session.url}`)

        return res.json({
            payment_intent: session.payment_intent
        }).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;