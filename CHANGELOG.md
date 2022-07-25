# Changelog

## 1.0.0 (2022-07-25)


### Features

* **api:** add api documentation ([3bb9487](https://www.github.com/aeternity/dex-backend/commit/3bb9487ea39a5e87f01dbc304eb5c5872492573a))
* **api:** add general and pairs support ([b2c1816](https://www.github.com/aeternity/dex-backend/commit/b2c1816b33485829d33a79376cd4d94c6df0265d))
* **api:** add token pairs with liquidity info route ([6917843](https://www.github.com/aeternity/dex-backend/commit/6917843137b4f3520e70d21194aa2e833e2eb2db))
* **api:** add token support ([d75d069](https://www.github.com/aeternity/dex-backend/commit/d75d0693c8437c5018d52ab58da67f952ab2ccc2))
* **api:** expose token-list management ([46a1482](https://www.github.com/aeternity/dex-backend/commit/46a148203aff5d82ffc920c2b8cf40f40a9373a1))
* **api:** support for swap routes ([666b9c6](https://www.github.com/aeternity/dex-backend/commit/666b9c6b1a8cd0229cd50e0a0db95956bfb37112))
* **api:** support for swap routes ([e6341dc](https://www.github.com/aeternity/dex-backend/commit/e6341dce85757a8a81cbe1ca34a2928f9ef19706))
* **api:** token list support ([22e4b2a](https://www.github.com/aeternity/dex-backend/commit/22e4b2ae7abf104eba60e89572472b4d57238c44))
* change token list management routes ([207f64a](https://www.github.com/aeternity/dex-backend/commit/207f64adf05819b966ef914a1818dd251f3207a9))
* **contracts:** contracts setup, utility functions and first test ([b0c27db](https://www.github.com/aeternity/dex-backend/commit/b0c27dbcce7d340a1dcda6c953cdad4ecd7f0f1e))
* **db:** create initial schema ([b660fde](https://www.github.com/aeternity/dex-backend/commit/b660fde2957b8756f1e75e9ee6bcebafa7504b74))
* **db:** postgresql container deployment bindings ([cb64b40](https://www.github.com/aeternity/dex-backend/commit/cb64b40d4ba509c4744ca67b8d7806e5373b8024))
* **global-state:** expose api and add worker support for overall service information ([5199181](https://www.github.com/aeternity/dex-backend/commit/5199181d550cd05cb3c101ea5c98536546475553))
* **mdw:** add option for listening all mdw events ([54be345](https://www.github.com/aeternity/dex-backend/commit/54be3452ffbe4e4dbff3fb0213d3b008d15ebd50))
* **worker:** add refresh pairs info ([fe5d99e](https://www.github.com/aeternity/dex-backend/commit/fe5d99eab8a13c1d5670f86cb9fb78281e4b6b9d))
* **worker:** add start point and logging ([71fe3e2](https://www.github.com/aeternity/dex-backend/commit/71fe3e244483905498a31b3f7034f69eabbf1197))
* **worker:** mark all pairs as unsynced ([fbbd909](https://www.github.com/aeternity/dex-backend/commit/fbbd9091a36839d01938a22332fc98943563fef2))
* **worker:** update liquidity info for all the pairs ([44d5472](https://www.github.com/aeternity/dex-backend/commit/44d547225644ddd99cfd135eab2dad2568617802))


### Bug Fixes

* add binaryTragets fix for docker deployment ([58d2fa4](https://www.github.com/aeternity/dex-backend/commit/58d2fa449d8bcf3301f99a54a3542695cba3eadc))
* parallel processing db insert errors ([007e7a0](https://www.github.com/aeternity/dex-backend/commit/007e7a00ee5b995488b2be39dfd1a571192704af))
* returning type for tokens/pairs1 ([e880896](https://www.github.com/aeternity/dex-backend/commit/e880896b8ef14d3a8460f9839a8190dcdc0b85f9))
* support invalid tokens ([27af289](https://www.github.com/aeternity/dex-backend/commit/27af28907fcbee206466e5cbd00a276e79c375b6))
* token name/symbol switching ([9ce68cb](https://www.github.com/aeternity/dex-backend/commit/9ce68cbb77469da321495e5e5881909a7309f5d9))


### Testing

* context mockup ([88410f9](https://www.github.com/aeternity/dex-backend/commit/88410f9b23c0b7f063a7a6d32ac918f3cfc10034))
* cover contracts calls ([e052dd2](https://www.github.com/aeternity/dex-backend/commit/e052dd2aca90e0a1b8c85bc7e3d9c8a9a6791658))
* **e2e:** /pair/swap-routes ([d9b2bf2](https://www.github.com/aeternity/dex-backend/commit/d9b2bf2dbaecc74feb62fe07223aacb4f1227ab4))
* **e2e:** add only-listed tests ([3f4ac83](https://www.github.com/aeternity/dex-backend/commit/3f4ac836c82cbf0de0f6c51d06d071e880039d27))
* **e2e:** clean test file structure ([863b66f](https://www.github.com/aeternity/dex-backend/commit/863b66f099660b9ffa7f4ee5efeadb0bb879267e))
* **e2e:** setup and tests ([ffd4f59](https://www.github.com/aeternity/dex-backend/commit/ffd4f5972ce4111cfd665daa307c04d3a89808d1))
* **e2e:** token list management ([5e9fc77](https://www.github.com/aeternity/dex-backend/commit/5e9fc772fe38c7734770bcaf47dd86ac91b9bd80))
* **e2e:** tokens api routes ([626956d](https://www.github.com/aeternity/dex-backend/commit/626956d91df229075b92663e202ecdcef61e396b))
* worker and middleware ([614eac4](https://www.github.com/aeternity/dex-backend/commit/614eac4e498952b977e4e01cac2b331e1791d354))
* worker based on context mockup and test db ([4a72f47](https://www.github.com/aeternity/dex-backend/commit/4a72f47b8981a427d5888b66255715ec9bed0126))


### Refactorings

* add eqeqeq linter rule ([c97480e](https://www.github.com/aeternity/dex-backend/commit/c97480e6ad5f5aa34b63b1f27cbfffc36792e0b2))
* avoiding overloaded api routes ([75b3f2c](https://www.github.com/aeternity/dex-backend/commit/75b3f2c3cd43765f8af2b2a3bd679a9db02752b1))
* change sequential dryrun calls into parallel ones ([0e5b998](https://www.github.com/aeternity/dex-backend/commit/0e5b99837eaf10c0405b036ee94f5ecba6c8dab0))
* createWrappedMethods ([412ba2a](https://www.github.com/aeternity/dex-backend/commit/412ba2a54cb21e1f54ba6ec8a83b318db26c9ecc))
* rename appService class member for pair and token controllers ([4f4852d](https://www.github.com/aeternity/dex-backend/commit/4f4852d4775918900b91de3b60966ea4b8a124f4))
* spell checking for ./src ([92cb902](https://www.github.com/aeternity/dex-backend/commit/92cb902e3b15f49c78c1705ee6bdb7c43349cfc9))
* spell checking for ./test ([a6555ae](https://www.github.com/aeternity/dex-backend/commit/a6555aeb1d22c2607bc3a4c7b0ef8fae162e2d25))
* store sdk client only in one place ([170f3cf](https://www.github.com/aeternity/dex-backend/commit/170f3cf01ac3c636f3b2e90a6511b821dc355a78))


### CI / CD

* add Dockerfile ([d055f67](https://www.github.com/aeternity/dex-backend/commit/d055f67ebbb4cc0a3a89ecbf99295b309ded7b04))
* add npm lint to tests pipeline ([41ff588](https://www.github.com/aeternity/dex-backend/commit/41ff5887c9a0a442250d73fdb6f3b8298db97370))
* add tests pipeline ([d35d7c6](https://www.github.com/aeternity/dex-backend/commit/d35d7c6d1bcae1c2d9377b80383372e48a064992))
* dockerfile entrypoint to expose db url, move all docker files in directory ([ed8647a](https://www.github.com/aeternity/dex-backend/commit/ed8647a59d45d30ab79ce4a8999417ba851643da))
* Dockerfile update ([582492b](https://www.github.com/aeternity/dex-backend/commit/582492b95996bcad88f859c363dffdd210db2aa1))
* fix app names in pipelines ([b1027be](https://www.github.com/aeternity/dex-backend/commit/b1027be1a8438c60a87e049532082f6dafa20291))
* fix docker build context ([8abc0a5](https://www.github.com/aeternity/dex-backend/commit/8abc0a534005bf9a559b0a4cdb79eadad09763b8))
* fix docker repo ([b0e1c00](https://www.github.com/aeternity/dex-backend/commit/b0e1c00615205c7cd899b695a6d629441a061bfb))
* fix Dockerfile context ([63df7b1](https://www.github.com/aeternity/dex-backend/commit/63df7b1cb24e9a674f8608e43a662707a7d3f53e))
* fix test pipeline run steps ([ee10a28](https://www.github.com/aeternity/dex-backend/commit/ee10a28a4fbc9aaa0a44cf87a20ceabfcd3b6334))
* gh action pipelines ([89e330e](https://www.github.com/aeternity/dex-backend/commit/89e330eeb1579b5010188b80b36ec23450b0e38b))
* make pipelines for both networks ([94f607f](https://www.github.com/aeternity/dex-backend/commit/94f607fd87b3c645dc476cb3d7406330ba36b906))
* test without docker cache ([c4c23ef](https://www.github.com/aeternity/dex-backend/commit/c4c23efa5dacda9c1aab70f0d91b7aa91435b354))
* update package,json with latest tests changes ([4883fd8](https://www.github.com/aeternity/dex-backend/commit/4883fd8518ff973327c173d2d61cdb06fe3111a2))


### Miscellaneous

* add ping timeout ([7e412e5](https://www.github.com/aeternity/dex-backend/commit/7e412e5ad1767dbb5b5c37b3de4377ecbd82c25b))
* dynamically create db connection string from multiple env vars ([4fbb78e](https://www.github.com/aeternity/dex-backend/commit/4fbb78e1b3599243d7ad94a4bc6529b1190c9ee7))
* increase sdk version to gh@head ([ec26a88](https://www.github.com/aeternity/dex-backend/commit/ec26a881ed3d0759d9a977d3ff4a7941fcb9086e))
* **npm:** add redeploy command ([a8bfb17](https://www.github.com/aeternity/dex-backend/commit/a8bfb17d3cdcde161d3e01df37a491c77eb8cbaf))
* **package-lock:** replace beta sdk version with stable one ([f312e30](https://www.github.com/aeternity/dex-backend/commit/f312e30c00c4fc9ade602c68f306d961eaff6834))
* raise error when there is no network env ([c124abf](https://www.github.com/aeternity/dex-backend/commit/c124abf2e67d3de85bd77fdb571c57e2ccc164eb))
* specify mainnet .env vars ([649cf9b](https://www.github.com/aeternity/dex-backend/commit/649cf9ba2e8445b14ab2e11a063eb7d260186bb6))
* synchronise pairs based on tx events ([dd3686b](https://www.github.com/aeternity/dex-backend/commit/dd3686bdd35a8ba95b148946c6fb7c7e8e9ac7ac))
