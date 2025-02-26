-- CreateTable
CREATE TABLE "CAPost" (
    "id" SERIAL NOT NULL,
    "ca" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "twitter" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CAPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CAPost_ca_idx" ON "CAPost"("ca");
