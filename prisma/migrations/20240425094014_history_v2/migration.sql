/*
  Warnings:

  - You are about to drop the column `totalSupply` on the `PairLiquidityInfoHistory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pairId,microBlockHash,transactionHash,logIndex]` on the table `PairLiquidityInfoHistory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pairId,microBlockHash,transactionHash,logIndex,error]` on the table `PairLiquidityInfoHistoryError` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aeUsdPrice` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deltaReserve0` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deltaReserve1` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventType` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderAccount` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logIndex` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionHash` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionIndex` to the `PairLiquidityInfoHistory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `reserve0` on the `PairLiquidityInfoHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `reserve1` on the `PairLiquidityInfoHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `logIndex` to the `PairLiquidityInfoHistoryError` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionHash` to the `PairLiquidityInfoHistoryError` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PairLiquidityInfoHistory_pairId_microBlockHash_key";

-- DropIndex
DROP INDEX "PairLiquidityInfoHistoryError_pairId_microBlockHash_error_key";

-- AlterTable
ALTER TABLE "PairLiquidityInfoHistory" DROP COLUMN "totalSupply",
ADD COLUMN     "aeUsdPrice" DECIMAL(100,6) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deltaReserve0" DECIMAL(100,0) NOT NULL,
ADD COLUMN     "deltaReserve1" DECIMAL(100,0) NOT NULL,
ADD COLUMN     "token0AePrice" DECIMAL(100,6),
ADD COLUMN     "token1AePrice" DECIMAL(100,6),
ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "senderAccount" TEXT NOT NULL,
ADD COLUMN     "logIndex" INTEGER NOT NULL,
ADD COLUMN     "transactionHash" TEXT NOT NULL,
ADD COLUMN     "transactionIndex" BIGINT NOT NULL,
DROP COLUMN "reserve0",
ADD COLUMN     "reserve0" DECIMAL(100,0) NOT NULL,
DROP COLUMN "reserve1",
ADD COLUMN     "reserve1" DECIMAL(100,0) NOT NULL;

-- AlterTable
ALTER TABLE "PairLiquidityInfoHistoryError" ADD COLUMN     "logIndex" INTEGER NOT NULL,
ADD COLUMN     "transactionHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistory_pairId_microBlockHash_transactionH_key" ON "PairLiquidityInfoHistory"("pairId", "microBlockHash", "transactionHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PairLiquidityInfoHistoryError_pairId_microBlockHash_transac_key" ON "PairLiquidityInfoHistoryError"("pairId", "microBlockHash", "transactionHash", "logIndex", "error");
