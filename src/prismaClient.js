const prismapkg = require('@prisma/client')

const prisma = new prismapkg.PrismaClient();

module.exports = prisma;
