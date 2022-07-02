module.exports = (reservations) => {
    return reservations.map((reservation) => {
        return {
            start: reservation.reserved_from,
            end: reservation.reserved_to
        }
    })
}