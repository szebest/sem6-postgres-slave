/*
  Warnings:

  - You are about to drop the column `paid_overtime` on the `reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reservation" DROP COLUMN "paid_overtime",
ADD COLUMN     "excess_payment" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ALTER COLUMN "amount_paid" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "net_received" SET DATA TYPE DOUBLE PRECISION;
