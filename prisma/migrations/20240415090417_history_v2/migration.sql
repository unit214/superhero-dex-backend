-- CreateTable
CREATE TABLE "PairLiquidityInfoHistoryV2" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "reserve0" BIGINT,
    "reserve1" BIGINT,
    "deltaReserve0" BIGINT,
    "deltaReserve1" BIGINT,
    "fiatPrice" BIGINT,
    "height" INTEGER NOT NULL,
    "microBlockTime" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "microBlockHash" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairLiquidityInfoHistoryV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairLiquidityInfoHistoryV2Error" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "microBlockHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "error" TEXT NOT NULL,
    "timesOccurred" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairLiquidityInfoHistoryV2Error_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistoryV2_pairId_microBlockHash_logIndex_key" ON "PairLiquidityInfoHistoryV2"("pairId", "microBlockHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistoryV2Error_pairId_microBlockHash_logIn_key" ON "PairLiquidityInfoHistoryV2Error"("pairId", "microBlockHash", "logIndex", "error");

-- AddForeignKey
ALTER TABLE "PairLiquidityInfoHistoryV2" ADD CONSTRAINT "PairLiquidityInfoHistoryV2_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairLiquidityInfoHistoryV2Error" ADD CONSTRAINT "PairLiquidityInfoHistoryV2Error_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
