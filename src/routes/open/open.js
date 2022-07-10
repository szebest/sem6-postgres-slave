const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const { ioObject } = require('../../socket')

const { isLoggedInValidator } = require('../../middlewares/authorization');

const { getDistance } = require('geolib');

const axios = require('axios')

router.post('/', isLoggedInValidator, async (req, res) => {
    // #swagger.summary = 'Used for opening the gate. User has to be logged in or send a plate in the body. To open the gate remotely from the phone provide an access token, for microcontroller provide an access token and the plate in the body. After successfully finding an reservation the server will emit an open event to all the sockets connected.'

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
                    "plate": {
                        "example": "string",
                        "type": "string",
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
    const plates = req.userId ? req.body.plate : undefined
    const latitude = req.body.latitude
    const longitude = req.body.longitude

    if (req.userId && latitude && longitude) {
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl + '/api/v1'
        const response = await axios
        .get('https://sem6-postgres-master.herokuapp.com/api/v1/slaves/parkingInformation', {
            params: {
              server: process.env.NODE_ENV === 'development' ?
                'http://sem6-postgres-slave1.herokuapp.com/api/v1' :
                fullUrl
            }
          })

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

    if (!id && !plates) {
        return res.sendStatus(400)
    }

    const currentDate = new Date()
    
    // Allow the user to enter 5 minutes earlier
    currentDate.setMinutes(currentDate.getMinutes() - 5)

    const isoDateFormat = currentDate.toISOString()

    try {
        const reservation = await prisma.reservation.findFirst({
            where: {
                AND: {
                    user_id: id,
                    plate: {
                        in: plates
                    },
                    reserved_from: {
                        lte: isoDateFormat
                    },
                    reserved_to: {
                        gte: isoDateFormat
                    },
                    is_inside: plates === undefined ? false : undefined,
                    payment_status: {
                        not: "created"
                    }
                }
            }
        })

        if (reservation !== null) {
            ioObject.io.emit('open')

            const updated = await prisma.reservation.update({
                where: {
                    id: reservation.id
                },
                data: {
                    is_inside: true
                }
            })

            return res.json({
                status: 'OPEN',
                foundReservation: updated
            }).status(200)
        }
        else {
            return res.json({
                status: 'FORBIDDEN',
                foundReservation: null
            }).status(403)
        }
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;