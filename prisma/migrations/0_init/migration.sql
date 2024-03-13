-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL DEFAULT 'n/a',
    "name" TEXT NOT NULL DEFAULT 'n/a',
    "decimals" INTEGER NOT NULL DEFAULT -1,
    "malformed" BOOLEAN NOT NULL DEFAULT false,
    "noContract" BOOLEAN NOT NULL DEFAULT false,
    "listed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pair" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "t0" INTEGER NOT NULL,
    "t1" INTEGER NOT NULL,
    "synchronized" BOOLEAN NOT NULL,

    CONSTRAINT "Pair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairLiquidityInfo" (
    "id" INTEGER NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "reserve0" TEXT NOT NULL,
    "reserve1" TEXT NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "PairLiquidityInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Pair_address_key" ON "Pair"("address");

-- AddForeignKey
ALTER TABLE "Pair" ADD CONSTRAINT "Pair_t0_fkey" FOREIGN KEY ("t0") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pair" ADD CONSTRAINT "Pair_t1_fkey" FOREIGN KEY ("t1") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairLiquidityInfo" ADD CONSTRAINT "PairLiquidityInfo_id_fkey" FOREIGN KEY ("id") REFERENCES "Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

