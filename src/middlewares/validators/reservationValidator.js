module.exports = ((req, res, next) => {
    const errors = []
    if (!req.body.reserved_from) {
        errors.push("reserved_from")
    }
    if (!req.body.reserved_to) {
        errors.push("reserved_to")
    }
    if (!req.body.user_id) {
        errors.push("user_id")
    }
    if (!req.body.plate) {
        errors.push("plate")
    }

    if (errors.length > 0) {
        return res.send({ errors }).status(400)
    }

    next()
})