const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const { ioObject } = require('../../socket')

const { isLoggedInValidator } = require('../../middlewares/authorization');

router.post('/', isLoggedInValidator, async (req, res) => {
    const id = req.userId
    const plate = req.body.plate

    const currentDate = new Date()
    
    // Allow the user to enter 5 minutes earlier
    currentDate.setMinutes(currentDate.getMinutes() - 5)

    const isoDateFormat = currentDate.toISOString()

    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                AND: {
                    OR: {
                        user_id: id
                    },
                    OR: {
                        plate
                    },
                    reserved_from: {
                        lte: isoDateFormat
                    },
                    reserved_to: {
                        gte: isoDateFormat
                    }
                }
            }
        })

        if (reservations.length > 0) {
            ioObject.io.emit('open')

            return res.json({
                status: 'Open',
                foundReservations: reservations
            }).status(200)
        }
        else {
            return res.json({
                status: 'Forbidden',
                foundReservations: reservations
            }).status(403)
        }
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;