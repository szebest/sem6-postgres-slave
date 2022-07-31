const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const { ioObject } = require('../../socket')

const { isLoggedInValidator } = require('../../middlewares/authorization');
const { overtimePriceCalculator } = require('../../util');

const { getDistance } = require('geolib');

const axios = require('axios')

router.post('/', isLoggedInValidator, async (req, res) => {
    // #swagger.summary = 'Used for leaving the parking. User has to be logged in or send a plate in the body. To open the gate remotely from the phone provide an access token, for microcontroller provide an access token and the plate in the body. After successfully finding an reservation the server will emit an open event to all the sockets connected.'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */

    /*  #swagger.parameters['body'] = {
            "name": "body",
            "in": "body",
            "@schema": {
                "type": "object",
                "properties": {
                    "plates": {
                        "example": "[[a]]",
                        "type": "array",
                        "description": "2d array of strings"
                    },
                    "latitude": {
                        "example": "5.0",
                        "type": "float",
                        "description": "The latitude of the user"
                    },
                    "longitude": {
                        "example": "10.0",
                        "type": "float",
                        "description": "The longitude of the user"
                    }
                }
            }
    } */
    const id = req.userId
    const plates = req.body.plates
    const latitude = req.body.latitude
    const longitude = req.body.longitude

    const fullUrl = 'https://' + req.get('host') + req.originalUrl + '/api/v1'
    const response = await axios
        .get('https://sem6-postgres-master.herokuapp.com/api/v1/slaves/parkingInformation', {
            params: {
                server: process.env.NODE_ENV === 'development' ?
                    'https://sem6-postgres-slave1.herokuapp.com/api/v1' :
                    fullUrl
            }
        })

    if (req.userId && latitude && longitude) {
        const parkingLatitude = response.data.latitude
        const parkingLongitude = response.data.longitude

        const metersAway = getDistance({
            latitude: parkingLatitude,
            longitude: parkingLongitude
        }, {
            latitude: latitude,
            longitude: longitude
        })

        if (metersAway > 300) {
            return res.json({
                status: 'TOO_FAR_FROM_PARKING',
                foundReservation: null
            }).status(403)
        }
    }

    if (!id || !plates) {
        return res.sendStatus(400)
    }

    try {
        for (let i = 0; i < plates.length; i++) {
            const reservation = await prisma.reservation.findFirst({
                where: {
                    user_id: id,
                    plate: {
                        in: plates[i]
                    },
                    is_inside: req.userId === undefined ? undefined : true,
                    payment_status: {
                        not: "created"
                    }
                }
            })
    
            if (reservation !== null) {
                const customer = await axios
                    .get(`https://sem6-postgres-master.herokuapp.com/api/v1/users/getCustomerInfoBySlave/${id}`, {
                        headers: {
                            authorization: `Bearer ${process.env.SLAVE_SECRET}`
                        }
                    })

                const isThisParkingOwner = customer.data.servers.some((server) => server.server_URL === fullUrl)

                ioObject.io.emit('open')
    
                const currentDate = new Date()
    
                const diffInDates = currentDate - reservation.reserved_to
    
                const updated = await prisma.reservation.update({
                    where: {
                        id: reservation.id
                    },
                    data: {
                        is_inside: false,
                        last_left: currentDate,
                        excess_payment: (!isThisParkingOwner && diffInDates > 0) ? 
                            overtimePriceCalculator(diffInDates / (1000 * 60 * 60), {
                                amountPerHour: response.data.price_per_overtime_hour
                            }) : 
                            undefined
                    }
                })
    
                return res.json({
                    status: 'OPEN',
                    foundReservation: updated
                }).status(200)
            }
        }

        return res.json({
            status: 'FORBIDDEN',
            foundReservation: null
        }).status(403)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;