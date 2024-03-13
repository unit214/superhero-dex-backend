-- CreateTable
CREATE TABLE "PairLiquidityInfoHistory" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "reserve0" TEXT NOT NULL,
    "reserve1" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "microBlockHash" TEXT NOT NULL,
    "microBlockTime" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairLiquidityInfoHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairLiquidityInfoHistoryError" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "microBlockHash" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "timesOccurred" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairLiquidityInfoHistoryError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistory_pairId_microBlockHash_key" ON "PairLiquidityInfoHistory"("pairId", "microBlockHash");

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistoryError_pairId_microBlockHash_error_key" ON "PairLiquidityInfoHistoryError"("pairId", "microBlockHash", "error");

-- AddForeignKey
ALTER TABLE "PairLiquidityInfoHistory" ADD CONSTRAINT "PairLiquidityInfoHistory_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairLiquidityInfoHistoryError" ADD CONSTRAINT "PairLiquidityInfoHistoryError_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
