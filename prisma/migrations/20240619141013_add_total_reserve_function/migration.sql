CREATE
OR REPLACE FUNCTION total_reserve (integer) RETURNS numeric AS 'SELECT SUM(CASE
                WHEN t.id = p.t0 THEN
                    (latest_liquidity_info."reserve0" / POW(10, t.decimals))
                ELSE (latest_liquidity_info."reserve1" / POW(10, t.decimals)) END
        )
 FROM "Token" t
          LEFT JOIN public."Pair" p on t.id = p.t0 OR t.id = p.t1
          LEFT JOIN LATERAL (SELECT *
                             FROM "PairLiquidityInfoHistory"
                             WHERE p.id = "pairId"
                             ORDER BY "microBlockTime" DESC, "logIndex" DESC
                             LIMIT 1) latest_liquidity_info ON TRUE
 WHERE $1 = t.id' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE
OR REPLACE FUNCTION volume_usd (integer, interval) RETURNS numeric AS 'SELECT ROUND(SUM(CASE
                WHEN t.id = p.t0 THEN
                    CASE
                        WHEN liquidity_history."token0AePrice" >= 0 AND
                             liquidity_history."eventType" = ''SwapTokens'' AND
                             liquidity_history."microBlockTime" >=
                             extract(epoch from NOW() - $2) * 1000
                            THEN
                            (ABS(liquidity_history."deltaReserve0") / POW(10, t.decimals)) *
                            liquidity_history."token0AePrice" *
                            liquidity_history."aeUsdPrice" END
                ELSE CASE
                         WHEN liquidity_history."token1AePrice" >= 0 AND
                              liquidity_history."eventType" = ''SwapTokens'' AND
                              liquidity_history."microBlockTime" >=
                              extract(epoch from NOW() - $2) * 1000
                             THEN
                             (ABS(liquidity_history."deltaReserve1") / POW(10, t.decimals)) *
                             liquidity_history."token1AePrice" *
                             liquidity_history."aeUsdPrice" END END
        )::numeric, 4)
 FROM "Token" t
          LEFT JOIN public."Pair" p on t.id = p.t0 OR t.id = p.t1
          LEFT JOIN "PairLiquidityInfoHistory" liquidity_history ON p.id = liquidity_history."pairId"

 WHERE $1 = t.id' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
