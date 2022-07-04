-- DropIndex
DROP INDEX "reservation_id_user_id_idx";

-- CreateIndex
CREATE INDEX "reservation_user_id_idx" ON "reservation"("user_id");

-- CreateIndex
CREATE INDEX "reservation_id_idx" ON "reservation"("id");
