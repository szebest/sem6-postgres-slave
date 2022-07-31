module.exports = (overtimeInHours, {
    amountPerHour = 10.0
}) => {
    return Math.round((overtimeInHours * (amountPerHour + 1)) * 100) / 100
}