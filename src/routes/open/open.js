const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const { ioObject } = require('../../socket')

const { isLoggedInValidator } = require('../../middlewares/authorization');

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
                    }
                }
            }
    } */
    const id = req.userId
    const plates = req.userId ? req.body.plate : undefined

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
                    is_inside: plates === undefined ? undefined : false,
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
                foundReservation: []
            }).status(403)
        }
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;