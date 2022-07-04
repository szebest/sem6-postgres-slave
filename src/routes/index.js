const express = require('express');

const reservationRoutes = require('./reservation/reservation')

const openRoutes = require('./open/open')

const leaveRoutes = require('./leave/leave')

const stripe = require('./stripe/stripe')

router = express.Router();

router.use('/reservations', reservationRoutes)

router.use('/open', openRoutes)

router.use('/leave', leaveRoutes)

router.use('/stripe', stripe)

module.exports = router;