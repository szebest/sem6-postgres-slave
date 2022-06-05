const express = require('express');

const reservationRoutes = require('./reservation/reservation')



router = express.Router();

router.use('/reservations', reservationRoutes)

module.exports = router;