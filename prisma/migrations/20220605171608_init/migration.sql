-- CreateTable
CREATE TABLE "reservation" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reserved_from" TIMESTAMP(3) NOT NULL,
    "reserved_to" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plate" VARCHAR(10) NOT NULL,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);
