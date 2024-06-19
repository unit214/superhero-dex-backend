CREATE FUNCTION total_reserve (integer) RETURNS numeric AS 'SELECT COALESCE((SELECT COALESCE(SUM(latest_liquidity_info_t0.reserve0 / POW(10, t0.decimals)),
                                  0) as total_reserve
                  FROM "Token" t0
                           LEFT JOIN public."Pair" pt0 on t0.id = pt0.t0
                           LEFT JOIN LATERAL (SELECT *
                                              FROM "PairLiquidityInfoHistory"
                                              WHERE pt0.id = "pairId"
                                              ORDER BY "microBlockTime" DESC, "logIndex" DESC
                                              LIMIT 1) latest_liquidity_info_t0 ON TRUE
                  WHERE $1 = t0.id), 0) +
        COALESCE((SELECT COALESCE(SUM(latest_liquidity_info_t1.reserve1 / POW(10, t1.decimals)),
                                  0) as total_reserve
                  FROM "Token" t1
                           LEFT JOIN public."Pair" pt1 on t1.id = pt1.t1
                           LEFT JOIN LATERAL (SELECT *
                                              FROM "PairLiquidityInfoHistory"
                                              WHERE pt1.id = "pairId"
                                              ORDER BY "microBlockTime" DESC, "logIndex" DESC
                                              LIMIT 1) latest_liquidity_info_t1 ON TRUE
                  WHERE $1 = t1.id), 0)' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
