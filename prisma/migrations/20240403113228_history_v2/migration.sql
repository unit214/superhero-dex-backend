-- CreateTable
CREATE TABLE "PairLiquidityInfoHistoryV2" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "microBlockHash" TEXT NOT NULL,
    "microBlockTime" BIGINT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "reserve0" TEXT NOT NULL,
    "reserve1" TEXT NOT NULL,
    "deltaReserve0" TEXT NOT NULL,
    "deltaReserve1" TEXT NOT NULL,
    "fiatPrice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairLiquidityInfoHistoryV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairLiquidityInfoHistoryV2Error" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "microBlockHash" TEXT NOT NULL,
    "logIndex" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "timesOccurred" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairLiquidityInfoHistoryV2Error_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistoryV2_pairId_microBlockHash_key" ON "PairLiquidityInfoHistoryV2"("pairId", "microBlockHash");

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistoryV2Error_pairId_microBlockHash_logIn_key" ON "PairLiquidityInfoHistoryV2Error"("pairId", "microBlockHash", "logIndex", "error");

-- AddForeignKey
ALTER TABLE "PairLiquidityInfoHistoryV2" ADD CONSTRAINT "PairLiquidityInfoHistoryV2_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairLiquidityInfoHistoryV2Error" ADD CONSTRAINT "PairLiquidityInfoHistoryV2Error_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
