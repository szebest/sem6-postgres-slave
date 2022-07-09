const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const { ioObject } = require('../../socket')

const { isLoggedInValidator } = require('../../middlewares/authorization');
const { overtimePriceCalculator } = require('../../util');

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

    try {
        const reservation = await prisma.reservation.findFirst({
            where: {
                user_id: id,
                plate: {
                    in: plates
                }
            }
        })

        if (reservation !== null) {
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
                    excess_payment: diffInDates > 0 ? await overtimePriceCalculator(diffInDates / (1000 * 60 * 60)) : undefined
                }
            })

            return res.json({
                status: 'Open',
                foundReservation: updated
            }).status(200)
        }
        else {
            return res.json({
                status: 'Forbidden',
                foundReservation: reservation
            }).status(403)
        }
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;