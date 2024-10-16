CREATE
OR REPLACE FUNCTION historic_price (integer, interval) RETURNS numeric AS 'SELECT  SUM(CASE
               WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") *
                                     (latest_liquidity_info."reserve0" / POW(10, t.decimals))
               ELSE (latest_liquidity_info."token1AePrice") *
                    (latest_liquidity_info."reserve1" / POW(10, t.decimals)) END /
           total_reserve(t.id, $2))
 FROM "Token" t
          LEFT JOIN "Pair" p on t.id = p.t0 OR t.id = p.t1
          LEFT JOIN LATERAL (SELECT *
                             FROM "PairLiquidityInfoHistory"
                             WHERE p.id = "pairId"
                                AND  "microBlockTime" <= extract(epoch from NOW() - $2) * 1000
                             ORDER BY "microBlockTime" DESC, "logIndex" DESC
                             LIMIT 1) latest_liquidity_info ON TRUE
 WHERE $1 = t.id' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
