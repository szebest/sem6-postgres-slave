const express = require('express');

const reservationRoutes = require('./reservation/reservation')

const openRoutes = require('./open/open')

const leaveRoutes = require('./leave/leave')



router = express.Router();

router.use('/reservations', reservationRoutes)

router.use('/open', openRoutes)

router.use('/leave', leaveRoutes)

module.exports = router;