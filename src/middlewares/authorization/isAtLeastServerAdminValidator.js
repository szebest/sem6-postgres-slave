const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const authToken = authHeader && authHeader.split(' ')[1]

    if (authToken === null) return res.sendStatus(401)
    else {
        jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403)

            if (user.userType < 2) {
                return res.sendStatus(403)
            }

            req.userLogin = user.login
            req.userId = user.id
            req.userType = user.userType
            next()
        })
    }
}