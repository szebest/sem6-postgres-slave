const isLoggedInValidator = require('./isLoggedInValidator')
const isAtLeastServerAdminValidator = require('./isAtLeastServerAdminValidator')
const isAtLeastDatabaseAdminValidator = require('./isAtLeastDatabaseAdminValidator')
const isSpecificUserValidator = require('./isSpecificUserValidator')
const hasUserValues = require('./hasUserValues')

module.exports = {
    isLoggedInValidator,
    isAtLeastServerAdminValidator,
    isAtLeastDatabaseAdminValidator,
    isSpecificUserValidator,
    hasUserValues
}