module.exports = (reservationDurationInHours, {
    amountPerHour = 5.0
}) => {
    return Math.round((reservationDurationInHours * amountPerHour) * 100) / 100
}