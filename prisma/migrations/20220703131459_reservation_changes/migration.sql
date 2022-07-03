-- AlterTable
ALTER TABLE "reservation" ADD COLUMN     "amount_paid" INTEGER,
ADD COLUMN     "is_inside" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_left" TIMESTAMP(3),
ADD COLUMN     "net_received" INTEGER,
ADD COLUMN     "paid_overtime" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payment_intent" VARCHAR(100),
ADD COLUMN     "payment_status" VARCHAR(20) NOT NULL DEFAULT E'created',
ADD COLUMN     "receipt_URL" VARCHAR(200);
