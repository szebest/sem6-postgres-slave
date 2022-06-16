module.exports = (req, res, next) => {
    if (!req.userLogin || !req.userId || !req.userType) {
        return res.sendStatus(403)
    }
    next()
}