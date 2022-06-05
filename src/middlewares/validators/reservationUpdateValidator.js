module.exports = ((req, res, next) => {
    const errors = []
    if (!req.body.plate) {
        errors.push("plate")
    }

    if (errors.length > 0) {
        return res.send({ errors }).status(400)
    }

    next()
})