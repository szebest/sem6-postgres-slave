/*
  Warnings:

  - You are about to alter the column `amount_paid` on the `reservation` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `net_received` on the `reservation` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `excess_payment` on the `reservation` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "reservation" ALTER COLUMN "amount_paid" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "net_received" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "excess_payment" SET DATA TYPE DECIMAL(10,2);
