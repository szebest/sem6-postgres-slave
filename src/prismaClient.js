const prismapkg = require('@prisma/client')

const prisma = new prismapkg.PrismaClient({
    log: ['query']
});

module.exports = prisma;
