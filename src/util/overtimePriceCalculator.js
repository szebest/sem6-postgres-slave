const axios = require('axios')

module.exports = (overtimeInHours) => {
    // get the value of PLN per overtime minute from env variable. Use default 0.08 PLN per minute if
    // env variable is not defined. Round the result to two decimal places
    const response = await axios
        .get('https://sem6-postgres-master.herokuapp.com/api/v1/slaves/parkingInformation', {
            params: {
                server: process.env.NODE_ENV === 'development' ?
                    'http://sem6-postgres-slave1.herokuapp.com/api/v1' :
                    fullUrl
            }
        })

    const amountPerHour = response.data.price_per_overtime_hour || 6.0

    return Math.round((overtimeInHours * amountPerHour) * 100) / 100
}