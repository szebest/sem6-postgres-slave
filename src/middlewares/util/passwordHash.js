const bcrypt = require('bcrypt')

module.exports = ((req, res, next) => {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
        if (err) {
            return res.send({ errors: [err] }).status(500)
        }
        req.body.password = hash
        next()
    });
})