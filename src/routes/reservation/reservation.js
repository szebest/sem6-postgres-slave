const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const axios = require('axios')

const { isAtLeastServerAdminValidator, isLoggedInValidator, isSpecificUserValidator, hasUserValues } = require('../../middlewares/authorization');
const { reservationValidator, reservationUpdateValidator } = require('../../middlewares/validators');
const { checkOverlaps } = require('../../util/');
const { reservationToDatesArray } = require('../../mappers');

router.get('/', isAtLeastServerAdminValidator, hasUserValues, async (_, res) => {
    // #swagger.summary = 'Returns all the reservations made on the server. User has to be at least an owner'

    /*  #swagger.parameters['authorization'] = {
                in: 'header',
                description: 'Access token',
    } */
    try {
        const allReservations = (await prisma.reservation.findMany())

        return res.json(allReservations).status(200)
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
    const id = parseInt(req.params.id)
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
    const id = parseInt(req.params.id)
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
    const id = parseInt(req.params.id)
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

router.post('/', /*reservationValidator, isLoggedInValidator, hasUserValues,*/ async (req, res) => {
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
        const allReservationsActive = await prisma.reservation.findMany({
            where: {
                reserved_to: {
                    gt: new Date().toISOString()
                }
            },
            orderBy: {
                reserved_from: 'asc'
            }
        })

        const overlaps = checkOverlaps(reservationToDatesArray(allReservationsActive), {
            start: new Date(req.body.reserved_from),
            end: new Date(req.body.reserved_to)
        })

        const response = await axios
            .get('sem6-postgres-master.herokuapp.com/api/v1/slaves/parkingSlotsInParking')

        const data = await response.json()

        return res.json({
            overlaps,
            data
        }).status(200)
        const created = await prisma.reservation.create({
            data: {
                reserved_from: req.body.reserved_from,
                reserved_to: req.body.reserved_to,
                user_id: req.userId,
                plate: req.body.plate
            }
        })

        return res.json(created).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;