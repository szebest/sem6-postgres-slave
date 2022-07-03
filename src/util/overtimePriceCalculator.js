module.exports = (overtimeInMinutes) => {
    // get the value of PLN per overtime minute from env variable. Use default 0.08 PLN per minute if
    // env variable is not defined. Round the result to two decimal places
    return Math.round((overtimeInMinutes * (process.env.PLN_PER_MINUTE_OVERTIME ?? 0.08)) * 100) / 100
}