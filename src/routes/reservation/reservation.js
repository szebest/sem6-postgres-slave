const express = require('express');
router = express.Router();

const prisma = require('../../prismaClient')

const { isAtLeastServerAdminValidator, isLoggedInValidator } = require('../../middlewares/authorization');
const { reservationValidator, reservationUpdateValidator } = require('../../middlewares/validators');

router.get('/', isAtLeastServerAdminValidator, async (_, res) => {
    try {
        const allReservations = (await prisma.reservation.findMany())

        return res.json(allReservations).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/:id', isAtLeastServerAdminValidator, async (req, res) => {
    const id = parseInt(req.params.id)
    try {
        const reservation = await prisma.reservation.findUnique({
            where: {
                id
            }
        })

        return res.json(reservation).status(200)
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.delete('/:id', isAtLeastServerAdminValidator, async (req, res) => {
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

router.post('/', reservationValidator, isLoggedInValidator, async (req, res) => {
    try {
        const created = await prisma.reservation.create({
            data: {
                reserved_from: req.body.reserved_from,
                reserved_to: req.body.reserved_to,
                user_id: req.body.user_id,
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