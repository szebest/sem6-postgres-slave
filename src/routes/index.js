const express = require('express');

const reservationRoutes = require('./reservation/reservation')

const openRoutes = require('./open/open')



router = express.Router();

router.use('/reservations', reservationRoutes)

router.use('/open', openRoutes)

module.exports = router;