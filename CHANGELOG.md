# Changelog

### [1.6.1](https://www.github.com/unit214/superhero-dex-backend/compare/v1.6.0...v1.6.1) (2024-11-19)


### Bug Fixes

* build now only includes src ([c3c4a3d](https://www.github.com/unit214/superhero-dex-backend/commit/c3c4a3db62cb1982810cdea23e8d032ad07ba872))

## [1.6.0](https://www.github.com/aeternity/dex-backend/compare/v1.5.0...v1.6.0) (2024-11-19)


### Features

* add caching to graph endpoint ([32519a9](https://www.github.com/aeternity/dex-backend/commit/32519a954e50765151a8e0e5708688d3c8f65ef5))
* add pool graphs to graph endpoint ([67b679c](https://www.github.com/aeternity/dex-backend/commit/67b679cbeaf880db431193bda3836eb7a7f4d878))
* add token graphs to graph endpoint ([8813407](https://www.github.com/aeternity/dex-backend/commit/88134079acbe8877bd0ad5215b64718cfaf99c60))
* add validation of query params to graph endpoint ([9fb632d](https://www.github.com/aeternity/dex-backend/commit/9fb632d603e41ab6c1ed0613e1f7b9591aacc251))
* adjust graph route response ([c97b19b](https://www.github.com/aeternity/dex-backend/commit/c97b19b5c65c507bd9fba074c832386575d1fc61))
* change get token route to token/:address and include price data ([3b6df5a](https://www.github.com/aeternity/dex-backend/commit/3b6df5a75610fb1dd7a9aa7078931d9158cecfb4))
* create graph endpoint and add overview graphs ([276a5f7](https://www.github.com/aeternity/dex-backend/commit/276a5f71694869a27ff1a6c5d57280bfdf263ddb))
* improve naming of available graph types ([dfde438](https://www.github.com/aeternity/dex-backend/commit/dfde438de9b24902c56d3814a2db82637b4c87ff))


### Bug Fixes

* add volumeUsdMonth to token getAllWithAggregation query ([07fa9dc](https://www.github.com/aeternity/dex-backend/commit/07fa9dc4dbdfcb85d8c53e6893cbc20fbe6d9d4e))
* correctly extract sender account from paying for transactions ([ff1cf07](https://www.github.com/aeternity/dex-backend/commit/ff1cf0782d3646e3ad16d8ae2d0e882b6c057e49))


### CI / CD

* change pr closed triggers ([64303fc](https://www.github.com/aeternity/dex-backend/commit/64303fc676cd33db9e80152c0bbc5824c890c663))
* update gh actions versions ([442e260](https://www.github.com/aeternity/dex-backend/commit/442e2603c734ce3db5140fb06b5cc09862d55ab9))


### Testing

* adjust e2e tests to newest changes ([7ff3cb8](https://www.github.com/aeternity/dex-backend/commit/7ff3cb8c0daf55d76c6694a13c271a211ccd3832))
* fix execution of e2e tests ([b8a7df3](https://www.github.com/aeternity/dex-backend/commit/b8a7df3786ef9a2e16038f4bcc7dbb259c99a731))
* fix unit tests ([8b7d0a3](https://www.github.com/aeternity/dex-backend/commit/8b7d0a30d1a7343265ddf6b530bd906a7c7808d3))
* force exit jest in e2e tests ([699e58e](https://www.github.com/aeternity/dex-backend/commit/699e58e1fd799e0ad65c486c098a9e158f6820ba))
* implement graph.controller.spec.ts ([231e3f1](https://www.github.com/aeternity/dex-backend/commit/231e3f1291282a449ecf39dc3ba86d6640285512))
* unskip test in pair-liquidity-info-history.controller.spec.ts ([8da59cb](https://www.github.com/aeternity/dex-backend/commit/8da59cbe49d24011a1b677f40a1ea4a76ace6f03))


### Refactorings

* change get token pairs route to token/:address/pair ([993e4d9](https://www.github.com/aeternity/dex-backend/commit/993e4d90439e03336db42fd3fc671029f64af759))
* improve api structure of pairs endpoints ([d4a0b88](https://www.github.com/aeternity/dex-backend/commit/d4a0b88e3292c45e4d9d17629319c4406a0bcc87))
* make limit and offset optional in history db ([082b4c5](https://www.github.com/aeternity/dex-backend/commit/082b4c544b4ca82472ccc9fb63a11cf89e73aaaa))

## [1.5.0](https://www.github.com/aeternity/dex-backend/compare/v1.4.0...v1.5.0) (2024-07-29)


### Features

* adds caching to costly endpoints ([1a2d975](https://www.github.com/aeternity/dex-backend/commit/1a2d975fd0ce4670188b786e58e97cb639307302))


### Miscellaneous

* adds testnet tokens to listing script ([fcb5fb4](https://www.github.com/aeternity/dex-backend/commit/fcb5fb42c220cfd055b79941090c9c8ea5ca1fa4))

## [1.4.0](https://www.github.com/aeternity/dex-backend/compare/v1.3.1...v1.4.0) (2024-06-26)


### Features

* adds listing token script ([3c23b68](https://www.github.com/aeternity/dex-backend/commit/3c23b683081e602785415add276d14aa41dc91d4))


### Bug Fixes

* removes schema from query ([91b3595](https://www.github.com/aeternity/dex-backend/commit/91b35957c3844a61881c723e2fe8728a7f40449a))

### [1.3.1](https://www.github.com/aeternity/dex-backend/compare/v1.3.0...v1.3.1) (2024-06-25)


### Bug Fixes

* removes schema name from migration ([b36b698](https://www.github.com/aeternity/dex-backend/commit/b36b698c1c9e96bef309b12580624021f4f568eb))

## [1.3.0](https://www.github.com/aeternity/dex-backend/compare/v1.2.0...v1.3.0) (2024-06-25)


### Features

* add fdvAe, fdvUsd, volumeUsd fields ([9a86f06](https://www.github.com/aeternity/dex-backend/commit/9a86f0658a811d914e67a779281c7a65ed1750d5))
* add price change percentage ([1718070](https://www.github.com/aeternity/dex-backend/commit/1718070036d645c4399abe97fe5e3299401a6a9a))
* add priceAe and priceUsd fields ([c6ea21b](https://www.github.com/aeternity/dex-backend/commit/c6ea21b15591cd69fa608b854e7a54b23019d2a4))
* add transactionHash to error table ([82d60fc](https://www.github.com/aeternity/dex-backend/commit/82d60fc66479341b8753f8083344bba75c075848))
* added new tables, added v2 importer and dbs ([10b46d9](https://www.github.com/aeternity/dex-backend/commit/10b46d9f9af9e39da0408b4aff4809f8da3b1294))
* adds sync algorithm to path calculator ([cab8b70](https://www.github.com/aeternity/dex-backend/commit/cab8b70b8852b148855edd2b0b68afd59ca807b4))
* change eslint simple-import-sort from warn to error, improve comment ([a3011a5](https://www.github.com/aeternity/dex-backend/commit/a3011a5d192c308cceee313e8657567d2ea82324))
* **explore:** adds api descriptions for updated endpoints ([af70592](https://www.github.com/aeternity/dex-backend/commit/af705926ba498ce5ea35dbab07d7aa7fa5bdf0ad))
* expose pair transactions count ([dcdcfcb](https://www.github.com/aeternity/dex-backend/commit/dcdcfcb43fcf22c7484cb5031d45f7e0bc67d440))
* expose tvl usd ([aa101db](https://www.github.com/aeternity/dex-backend/commit/aa101db4fef6c896c9c579017b787b718cfc30dd))
* expose volumes for given timeframes ([47da600](https://www.github.com/aeternity/dex-backend/commit/47da6001bf5abff16c3e21276c9056369ae0c91a))
* fetches and exposes data for sender ([b0c92c6](https://www.github.com/aeternity/dex-backend/commit/b0c92c6c44c517f208b060ed6acde251e25ca1dd))
* **history:** actually returns history entries ([57346bb](https://www.github.com/aeternity/dex-backend/commit/57346bb89c8f85dde3d95222412459ba09cd35b7))
* **history:** adds aeprice and query for entries without ([9b4dfdf](https://www.github.com/aeternity/dex-backend/commit/9b4dfdf335df11d09f3793ac817ec9a499ef762f))
* **history:** adds history query by token ([05b90c0](https://www.github.com/aeternity/dex-backend/commit/05b90c037677e102da809316a9167bdd60cb5e0d))
* **history:** finishes history price api ([2327b8b](https://www.github.com/aeternity/dex-backend/commit/2327b8b42d156b0b9d34322bf9b0c534cc8305ef))
* **history:** moves usd calculation to the backend ([51fedb2](https://www.github.com/aeternity/dex-backend/commit/51fedb21becaedefd6953686971a52f5bbd902c0))
* **history:** separates usd values by token ([ae21fff](https://www.github.com/aeternity/dex-backend/commit/ae21fffd4f84be6c4d936d830e52187364d35f44))
* implemented fetching of fiat price via coinmarketcap api ([37e099a](https://www.github.com/aeternity/dex-backend/commit/37e099ac08a75b81def21183d9d3920ba8131358))
* implemented validator v2 ([d35b31c](https://www.github.com/aeternity/dex-backend/commit/d35b31c00e165b41e99b338093ac7ead3eeb8e11))
* **pairs:** adds token filter to pair usd endpoint ([d1dbbb7](https://www.github.com/aeternity/dex-backend/commit/d1dbbb72244edd90e5825c80f5e9f2a309f1e867))
* parse event and insert reserve and deltaReserve ([7858329](https://www.github.com/aeternity/dex-backend/commit/78583298b61c9db2d89aabf59b37320ddfe22256))
* pr feedback: sync events with deltaReserves, code improvements, correct CronExpression for v2 importer ([c38f495](https://www.github.com/aeternity/dex-backend/commit/c38f4956b004103366004d8e0d38707562ebd94c))
* triggers history sync on new tx ([138d45c](https://www.github.com/aeternity/dex-backend/commit/138d45c3056709aa83dab56235f491047f36be8d))
* update schema in preparation of event parsing, update comments ([aa3bf17](https://www.github.com/aeternity/dex-backend/commit/aa3bf17d6cd53cd4bd1e80e47ab79178f6dca203))


### Bug Fixes

* add not previously checked in forgotten migration ([945fd25](https://www.github.com/aeternity/dex-backend/commit/945fd2521b98ba0a6f5bf2e77b6ed43b0017ed66))
* addresses type issues ([4ae5393](https://www.github.com/aeternity/dex-backend/commit/4ae539331bd6cb498f2e9618512dc63f3e267320))
* db v2 e2e test ([3b27f2d](https://www.github.com/aeternity/dex-backend/commit/3b27f2d0d66bc65f1e2e6c82e406b9b0e6f9325c))
* eslint import order ([9786ed1](https://www.github.com/aeternity/dex-backend/commit/9786ed1ee7ee8106afa99da6aa2e7e79a8d6d2e3))
* fix int-as-string param in mdw paginated calls ([a148233](https://www.github.com/aeternity/dex-backend/commit/a1482338c39526fa19f9d2f59cc84e77f8be0cef))
* **history:** also sort by log index ([74237c3](https://www.github.com/aeternity/dex-backend/commit/74237c32b8142fee668e8dcfe32c054f670e4b06))
* **history:** joins in decimals for proper price calculation ([58abcb2](https://www.github.com/aeternity/dex-backend/commit/58abcb276f282088d8026a10e4e33ae5b5d23035))
* linter ([3d76c9d](https://www.github.com/aeternity/dex-backend/commit/3d76c9d92938cc2d40103f80e6ed8d64ce67212b))
* PairMint amount parsing ([e560ef8](https://www.github.com/aeternity/dex-backend/commit/e560ef8cea95aff3ffdefdfcc9b60034188ea3bc))
* **pair:** this being undefined during event based sync ([634b760](https://www.github.com/aeternity/dex-backend/commit/634b76058108e95993e43ae5d37689fc6ab440ca))
* **pair:** this being undefined during factory event ([932646b](https://www.github.com/aeternity/dex-backend/commit/932646bb511221b7772ff5379bc34ee8b70e7cac))
* re-added task module to app module, added correct filter in importer v2 ([6766a02](https://www.github.com/aeternity/dex-backend/commit/6766a02e480676aa22aaf19f0bb6e9569b777970))
* removes .env file from repo ([7daeb55](https://www.github.com/aeternity/dex-backend/commit/7daeb55d3fa7bf34630fa6905dbe47f9bc24cbf4))
* strict-boolean-expressions eslint errors ([dca0e53](https://www.github.com/aeternity/dex-backend/commit/dca0e536ee675a5efdd401e8835a739f5afdca34))
* tasks service unit test ([2b518c4](https://www.github.com/aeternity/dex-backend/commit/2b518c438f8f923de59b5280bf9f70d3c7eeeca1))
* usd value pattern regex ([98f88e3](https://www.github.com/aeternity/dex-backend/commit/98f88e3fc5c5970ee9a55dafd0c9475bc0674416))


### CI / CD

* fix tag in production deploy step ([342f51e](https://www.github.com/aeternity/dex-backend/commit/342f51e6b2bfb83e9db7d8978eeac6170d055f37))


### Refactorings

* adds senderAccount to data model ([cc01a9a](https://www.github.com/aeternity/dex-backend/commit/cc01a9add10a4ffcf6b62a9caef56e7290bb5aa9))
* adds senderAccount to database ([873c66f](https://www.github.com/aeternity/dex-backend/commit/873c66fe355dad2a2163a4ab4b19da70403fe13d))
* adjust and fix worker related tests ([204b799](https://www.github.com/aeternity/dex-backend/commit/204b799eb1bd89522ea9169f33167e5971a7ea39))
* deleted worker directory ([e4eff52](https://www.github.com/aeternity/dex-backend/commit/e4eff5267d3e0fa4b8209706703fdd8be45ba391))
* feedback: db changes, move sliding window blocks to constant ([4f2f9ae](https://www.github.com/aeternity/dex-backend/commit/4f2f9ae2215daa65ef5ae616234573df2c822d9d))
* improve imports in main.ts ([61eac3a](https://www.github.com/aeternity/dex-backend/commit/61eac3a6a333f0ea0c93c8223023afb2dd07b5c1))
* improved type and variable naming consistency ([86576b5](https://www.github.com/aeternity/dex-backend/commit/86576b569354de45033ae1ac43070f8fa4b1bf4f))
* include pair and tokens in getWithinHeightSorted ([e3ff28c](https://www.github.com/aeternity/dex-backend/commit/e3ff28c95294e12a6d0a898c4fe60aca73fc6f3f))
* make private methods private, use square brackets accessor for tests ([056304a](https://www.github.com/aeternity/dex-backend/commit/056304aaf9d25ace2ca81b9fa97bbb3cc67ef86d))
* move context to PairSyncService, create SdkClientService ([10ad395](https://www.github.com/aeternity/dex-backend/commit/10ad39530d61bda13037d73c239de3a46497b41e))
* move db logic to nest, create ApiModule ([dc79a59](https://www.github.com/aeternity/dex-backend/commit/dc79a59ed4a6faabb05491301ec3b872d155c85f))
* move dto.ts to /api and rename to api.model.ts ([c229813](https://www.github.com/aeternity/dex-backend/commit/c22981370eac536f58d52f236e6bd868bba8f4aa))
* move worker and mdw websocket to nest services, rename worker to PairSyncService ([e5a60d9](https://www.github.com/aeternity/dex-backend/commit/e5a60d915241aff2ecdc17c1fece75745451d80a))
* **pair:** avoid parametrization of functions ([b7f4cdd](https://www.github.com/aeternity/dex-backend/commit/b7f4cdd7f5e4ac08395f1c13c572d19e4f4be4a5))
* re-move tokenConditions into PairDbService ([ec48d4d](https://www.github.com/aeternity/dex-backend/commit/ec48d4de8c8bd19071a0f2883ef4263a46aabaca))
* remove unnecessary type casting ([d1e1426](https://www.github.com/aeternity/dex-backend/commit/d1e1426e9dc979569ac6417a44233991c60c9410))
* remove v1 history and rename v2 history to just history ([9f13fec](https://www.github.com/aeternity/dex-backend/commit/9f13fec137eaa10d3c0b25b22d9cf46ac3efa951))
* rename api files to reflect class name ([b5908aa](https://www.github.com/aeternity/dex-backend/commit/b5908aa208ea0987a01850d4a0249a4f5a90b4c7))
* reorder and adjust privacy of functions in PairSyncService and MdwWsClientService ([bb2c17f](https://www.github.com/aeternity/dex-backend/commit/bb2c17fbbe9afcc17d350fd6c8e644ab120ac891))
* reorganize tests according to nest best practice ([0540871](https://www.github.com/aeternity/dex-backend/commit/05408710dbfd566858d070faac650d45d72bdec1))
* simplify total reserve function ([b782098](https://www.github.com/aeternity/dex-backend/commit/b7820981fc06311863d030b76d95bf5cee5b9b4d))
* updates query params from kebab to camel case ([419dd0d](https://www.github.com/aeternity/dex-backend/commit/419dd0dcee1057224d0d8f9eed30eda25b3edd45))
* use absolute import paths and sort imports with eslint ([f85499b](https://www.github.com/aeternity/dex-backend/commit/f85499b2c8846e47af43370a5eee3450067506d6))
* use decimal instead of bigint in db ([89799a9](https://www.github.com/aeternity/dex-backend/commit/89799a9d5ecaa1115a2ecf57c97b42a4c91f554d))
* use HttpService in MdwHttpClientService ([dce7322](https://www.github.com/aeternity/dex-backend/commit/dce73222a99adb603c608302ab426e2dd06c836d))


### Miscellaneous

* add prettier for embedded sql ([c2df26a](https://www.github.com/aeternity/dex-backend/commit/c2df26acba18a16630adcdbc2fb9e5ab85eecf3a))
* adds todo ([b5737b0](https://www.github.com/aeternity/dex-backend/commit/b5737b01844022104480a29fed74305aa94ff217))
* adds todos for further fields ([f74f96f](https://www.github.com/aeternity/dex-backend/commit/f74f96fb025bbcc335c96e4799feb639cfdfa565))
* adds todos for philipp ([1c554a1](https://www.github.com/aeternity/dex-backend/commit/1c554a10e379194433c606eddc1fe35cb6fe2fdc))
* cleanup api spec, round ae value to 18 decimals, db migrate instead of push ([5c6b99e](https://www.github.com/aeternity/dex-backend/commit/5c6b99ec4508f33a75291423a55e79d14fb88334))
* fixes mock ae value ([5c34119](https://www.github.com/aeternity/dex-backend/commit/5c34119e088904c283c26af0b89df02b9d3e8a68))
* removes a few console.log calls ([ab14b04](https://www.github.com/aeternity/dex-backend/commit/ab14b04fff8b3bc57935044993092e6a1e8af268))
* rename fdv to tvl as we aren't using total supply in calculation ([cb79433](https://www.github.com/aeternity/dex-backend/commit/cb7943345280c9a34d61cb6c6762a0ba20f140cf))
* wip ([6f6380d](https://www.github.com/aeternity/dex-backend/commit/6f6380d7b91e70fc18d203253edd5d24dcd0ee41))


### Testing

* add unit test for CoinmarketcapClient ([d8f4d31](https://www.github.com/aeternity/dex-backend/commit/d8f4d31742e2b779f203e661d3540fc5d3e8e460))
* add unit tests for validatorV2 ([44d91a5](https://www.github.com/aeternity/dex-backend/commit/44d91a56f609c040124ae8d2e75902f7005a0e07))
* e2e tests for v2 dbs ([bbcd4a4](https://www.github.com/aeternity/dex-backend/commit/bbcd4a4c5ae1782df69a08b53cb44235040ed8b8))
* feedback: introduce jest snapshots ([ef61c86](https://www.github.com/aeternity/dex-backend/commit/ef61c86ecb112ff7356358f1410c2d0746152ab3))
* feedback: use it.skip() for commented out test ([7924c41](https://www.github.com/aeternity/dex-backend/commit/7924c41ce0d7273997ebc6de874c4c3de5f9e033))
* fix existing tests ([c95d4e2](https://www.github.com/aeternity/dex-backend/commit/c95d4e2f9b1d89ce664435c931f1f0a8bd2b5a86))
* fix task service unit test ([604580a](https://www.github.com/aeternity/dex-backend/commit/604580a9513874b38fb053a65b66e4b80c255f91))
* fixes all currently active tests ([0fee94c](https://www.github.com/aeternity/dex-backend/commit/0fee94c8cba49eb3aa40df1a60c5cb52727a6181))
* improve robustness of CoinmarketcapClient spec ([37c55e2](https://www.github.com/aeternity/dex-backend/commit/37c55e2e6921dea76072a1ca053f1ec0fecdff70))
* include coinmarketcap API error in importer unit test ([267bb7e](https://www.github.com/aeternity/dex-backend/commit/267bb7e809d7b516a17eb827b7a7249500152395))
* re-organize mock data and utils ([6152790](https://www.github.com/aeternity/dex-backend/commit/61527903a11f91264c4fddbfc2ee5d692bff993d))
* unit tests for importerV2 ([3846b84](https://www.github.com/aeternity/dex-backend/commit/3846b84841a3b4aedf94b2bd528bb597054407fd))

## [1.2.0](https://www.github.com/aeternity/dex-backend/compare/v1.1.1...v1.2.0) (2024-05-02)


### Features

* add history tables and implement history importer task ([2b23eed](https://www.github.com/aeternity/dex-backend/commit/2b23eedb96be745d655cf05817389f103d7ff9ca))
* add init and pair liquidity info history migrations ([6be08aa](https://www.github.com/aeternity/dex-backend/commit/6be08aaee184481999ac4e31144c980316658314))
* add run task function handling isSyncRunning logic ([682ffdf](https://www.github.com/aeternity/dex-backend/commit/682ffdfc19c84dcfcc00bfc125b72e1a29fa53ab))
* add scheduling, resolve todos, cleanup & improve ([8ff29ba](https://www.github.com/aeternity/dex-backend/commit/8ff29ba730bca090f99cece32a2efa211055bae0))
* allow only running one task (importer or validator) at a time ([6695d03](https://www.github.com/aeternity/dex-backend/commit/6695d03588417e3ab467f099178f3629ba57734f))
* implemented api for pair liquidity info history ([18fc490](https://www.github.com/aeternity/dex-backend/commit/18fc4901ab48cfa70c5cdcce86f178172a7c7490))
* implemented history validation task ([5b0e651](https://www.github.com/aeternity/dex-backend/commit/5b0e651b6cd0e9d73f070222566fdb842878733a))
* **importer:** fetch only as many pages as needed ([9726428](https://www.github.com/aeternity/dex-backend/commit/9726428792f7949eaedf1d7dac5cf69cd0f6f5df))
* **importer:** skip if recent error. insert initial liquidity on first sync ([6a33906](https://www.github.com/aeternity/dex-backend/commit/6a3390635de4decbc1185a702f96944748c5def2))
* replace lossless-json with int-as-string parameter ([9f74e43](https://www.github.com/aeternity/dex-backend/commit/9f74e432eddd3e327d94c39aadc039b0fc49b3bd))
* **worker:** automatic reconnects ([632be66](https://www.github.com/aeternity/dex-backend/commit/632be66eed2290f7d5e085e7f30f96a337458056))


### Bug Fixes

* error print on task lvl ([2d145b1](https://www.github.com/aeternity/dex-backend/commit/2d145b1c8aa90bd681a9cbc607970b378cc23bee))
* **importer:** fix block run, when other operation is still running ([7f9208d](https://www.github.com/aeternity/dex-backend/commit/7f9208d13bab375bd31af4b8654e623c8fc78c2e))
* readd function after rebase ([faec624](https://www.github.com/aeternity/dex-backend/commit/faec6241f563be00173f74e9b03e937a14690987))
* **validator:** adjustments after rebase ([7f036bf](https://www.github.com/aeternity/dex-backend/commit/7f036bfe2c5ebc9a782f019fe68f497e13db379f))
* **validator:** fix cronjob frequency ([35e6bc0](https://www.github.com/aeternity/dex-backend/commit/35e6bc0f0a954e62cd716923f7e1b9372771b65c))


### CI / CD

* add github action to lint and prettify on PR lvl ([e84afed](https://www.github.com/aeternity/dex-backend/commit/e84afed9308540c7087d0317ac1b9d0ae11af4eb))
* refactor prod release ([87c1de8](https://www.github.com/aeternity/dex-backend/commit/87c1de89fb1e01aee5f889424d733ccc28f23f69))
* remove if from the production deploy step ([e9a6fa9](https://www.github.com/aeternity/dex-backend/commit/e9a6fa90e1d5db89921396468442dce6d98d48c1))


### Refactorings

* adjust contractAddress and microBlock hash pattern ([29be71d](https://www.github.com/aeternity/dex-backend/commit/29be71d6c8fb04bfd7ba65a4dd8272e9982b66e6))
* change location of clients module + minor codestyle things ([7ee5d63](https://www.github.com/aeternity/dex-backend/commit/7ee5d63005b618cdc702a559e103abc19e7a6880))
* implement PR feedback ([8469b7e](https://www.github.com/aeternity/dex-backend/commit/8469b7e7f2e27e7b431bc9ba9ac616d952eb495c))
* **importer:** don't always refetch last microblock ([3d3c2b9](https://www.github.com/aeternity/dex-backend/commit/3d3c2b907395687f4ab9ffebf4ff418f225554dd))
* **importer:** simplify is first run check ([6ef5cf7](https://www.github.com/aeternity/dex-backend/commit/6ef5cf714bff821fa12ccc1ce7108e99023e9487))
* **importer:** thoroughly use Encoded string types everywhere ([cad05b9](https://www.github.com/aeternity/dex-backend/commit/cad05b96ae86becc809705be19ad83c6f071343f))
* migrate fetch contract balances at micro block to v2 endpoint ([167b30f](https://www.github.com/aeternity/dex-backend/commit/167b30f67279f08e7a273a4a5d8726ce11297be3))
* remove unnecessary async in function def ([a66f1cd](https://www.github.com/aeternity/dex-backend/commit/a66f1cd8f54bf2e8dcda8be311c22b7f8cc982e1))
* revert schema change ([d42a7ac](https://www.github.com/aeternity/dex-backend/commit/d42a7ac0283a50e05c0b2d135d944c58e94d2278))
* **validator:** feedback: improve cron notation, avoid double await ([8926599](https://www.github.com/aeternity/dex-backend/commit/8926599b509a2f9a52f19448f782447db66af3e6))
* **validator:** improving typing of hashOrKbi param ([73ad896](https://www.github.com/aeternity/dex-backend/commit/73ad896680191adf2e555e52facdca11d1cb3f84))
* **validator:** resolve todos, move sorting to db ([6a8a6bd](https://www.github.com/aeternity/dex-backend/commit/6a8a6bdcb8dca632a133e66d8a13d1149412669e))


### Testing

* add e2e tests for PairLiquidityInfoHistoryDbService and PairLiquidityInfoHistoryErrorDbService ([081bbb0](https://www.github.com/aeternity/dex-backend/commit/081bbb056ea2369a901a24bec756cee931999d2f))
* add unit tests for PairLiquidityInfoHistoryController ([5bc2f8f](https://www.github.com/aeternity/dex-backend/commit/5bc2f8f611d8e1f05ba5b9b80a878edee1a82a66))
* adjust isRunning logic, implement unit tests for TasksService ([2de9430](https://www.github.com/aeternity/dex-backend/commit/2de94303441444e672ed4900c6737477f74e0a0a))
* implement unit tests for ImporterService ([774dfc9](https://www.github.com/aeternity/dex-backend/commit/774dfc9aecfdec8bec5ca9c443e84c61e89faee9))
* implement unit tests for ValidatorService ([eb77794](https://www.github.com/aeternity/dex-backend/commit/eb777947ffbd00dccec8254aabc7b2e8c098da6c))
* run test ci on pr lvl, fix e2e tests ([e0ee1cc](https://www.github.com/aeternity/dex-backend/commit/e0ee1cce2f16148a5dac939d6f5ea0fe226f318b))


### Miscellaneous

* adjust changelog for release 1.2.1 ([46cb296](https://www.github.com/aeternity/dex-backend/commit/46cb296413a4a89723eab7cb0c84e1ef33927374))
* release 1.2.0 ([21d3910](https://www.github.com/aeternity/dex-backend/commit/21d3910b3781e8aabf5a29e7c2cbcad5a0e6c288))
* release 1.2.1 ([83417cd](https://www.github.com/aeternity/dex-backend/commit/83417cdf910096e6a89472dc1a71f6a85825e793))
* upgrade aepp-sdk to 13.3.2 ([a780d2b](https://www.github.com/aeternity/dex-backend/commit/a780d2bad9c1c640707ffc6e904bb49ebad928d2))

### [1.2.1](https://www.github.com/unit214/superhero-dex-backend/compare/v1.2.0...v1.2.1) (2024-04-25)


### Miscellaneous

* upgrade aepp-sdk to 13.3.2 ([a780d2b](https://www.github.com/unit214/superhero-dex-backend/commit/a780d2bad9c1c640707ffc6e904bb49ebad928d2))
* mark history/liquidity endpoint as deprecated  ([8be1984](https://github.com/unit214/superhero-dex-backend/commit/8be1984a1b55ba0cc50075b87421a993af8911b8))

## [1.2.0](https://www.github.com/unit214/superhero-dex-backend/compare/v1.1.1...v1.2.0) (2024-03-22)


### Features

* add history tables and implement history importer task ([2b23eed](https://www.github.com/unit214/superhero-dex-backend/commit/2b23eedb96be745d655cf05817389f103d7ff9ca))
* add init and pair liquidity info history migrations ([6be08aa](https://www.github.com/unit214/superhero-dex-backend/commit/6be08aaee184481999ac4e31144c980316658314))
* add run task function handling isSyncRunning logic ([682ffdf](https://www.github.com/unit214/superhero-dex-backend/commit/682ffdfc19c84dcfcc00bfc125b72e1a29fa53ab))
* add scheduling, resolve todos, cleanup & improve ([8ff29ba](https://www.github.com/unit214/superhero-dex-backend/commit/8ff29ba730bca090f99cece32a2efa211055bae0))
* allow only running one task (importer or validator) at a time ([6695d03](https://www.github.com/unit214/superhero-dex-backend/commit/6695d03588417e3ab467f099178f3629ba57734f))
* implemented api for pair liquidity info history ([18fc490](https://www.github.com/unit214/superhero-dex-backend/commit/18fc4901ab48cfa70c5cdcce86f178172a7c7490))
* implemented history validation task ([5b0e651](https://www.github.com/unit214/superhero-dex-backend/commit/5b0e651b6cd0e9d73f070222566fdb842878733a))
* **importer:** fetch only as many pages as needed ([9726428](https://www.github.com/unit214/superhero-dex-backend/commit/9726428792f7949eaedf1d7dac5cf69cd0f6f5df))
* **importer:** skip if recent error. insert initial liquidity on first sync ([6a33906](https://www.github.com/unit214/superhero-dex-backend/commit/6a3390635de4decbc1185a702f96944748c5def2))
* replace lossless-json with int-as-string parameter ([9f74e43](https://www.github.com/unit214/superhero-dex-backend/commit/9f74e432eddd3e327d94c39aadc039b0fc49b3bd))
* **worker:** automatic reconnects ([632be66](https://www.github.com/unit214/superhero-dex-backend/commit/632be66eed2290f7d5e085e7f30f96a337458056))


### Bug Fixes

* error print on task lvl ([2d145b1](https://www.github.com/unit214/superhero-dex-backend/commit/2d145b1c8aa90bd681a9cbc607970b378cc23bee))
* **importer:** fix block run, when other operation is still running ([7f9208d](https://www.github.com/unit214/superhero-dex-backend/commit/7f9208d13bab375bd31af4b8654e623c8fc78c2e))
* readd function after rebase ([faec624](https://www.github.com/unit214/superhero-dex-backend/commit/faec6241f563be00173f74e9b03e937a14690987))
* **validator:** adjustments after rebase ([7f036bf](https://www.github.com/unit214/superhero-dex-backend/commit/7f036bfe2c5ebc9a782f019fe68f497e13db379f))
* **validator:** fix cronjob frequency ([35e6bc0](https://www.github.com/unit214/superhero-dex-backend/commit/35e6bc0f0a954e62cd716923f7e1b9372771b65c))


### CI / CD

* add github action to lint and prettify on PR lvl ([e84afed](https://www.github.com/unit214/superhero-dex-backend/commit/e84afed9308540c7087d0317ac1b9d0ae11af4eb))
* refactor prod release ([87c1de8](https://www.github.com/unit214/superhero-dex-backend/commit/87c1de89fb1e01aee5f889424d733ccc28f23f69))
* remove if from the production deploy step ([e9a6fa9](https://www.github.com/unit214/superhero-dex-backend/commit/e9a6fa90e1d5db89921396468442dce6d98d48c1))


### Refactorings

* adjust contractAddress and microBlock hash pattern ([29be71d](https://www.github.com/unit214/superhero-dex-backend/commit/29be71d6c8fb04bfd7ba65a4dd8272e9982b66e6))
* change location of clients module + minor codestyle things ([7ee5d63](https://www.github.com/unit214/superhero-dex-backend/commit/7ee5d63005b618cdc702a559e103abc19e7a6880))
* implement PR feedback ([8469b7e](https://www.github.com/unit214/superhero-dex-backend/commit/8469b7e7f2e27e7b431bc9ba9ac616d952eb495c))
* **importer:** don't always refetch last microblock ([3d3c2b9](https://www.github.com/unit214/superhero-dex-backend/commit/3d3c2b907395687f4ab9ffebf4ff418f225554dd))
* **importer:** simplify is first run check ([6ef5cf7](https://www.github.com/unit214/superhero-dex-backend/commit/6ef5cf714bff821fa12ccc1ce7108e99023e9487))
* **importer:** thoroughly use Encoded string types everywhere ([cad05b9](https://www.github.com/unit214/superhero-dex-backend/commit/cad05b96ae86becc809705be19ad83c6f071343f))
* migrate fetch contract balances at micro block to v2 endpoint ([167b30f](https://www.github.com/unit214/superhero-dex-backend/commit/167b30f67279f08e7a273a4a5d8726ce11297be3))
* remove unnecessary async in function def ([a66f1cd](https://www.github.com/unit214/superhero-dex-backend/commit/a66f1cd8f54bf2e8dcda8be311c22b7f8cc982e1))
* revert schema change ([d42a7ac](https://www.github.com/unit214/superhero-dex-backend/commit/d42a7ac0283a50e05c0b2d135d944c58e94d2278))
* **validator:** feedback: improve cron notation, avoid double await ([8926599](https://www.github.com/unit214/superhero-dex-backend/commit/8926599b509a2f9a52f19448f782447db66af3e6))
* **validator:** improving typing of hashOrKbi param ([73ad896](https://www.github.com/unit214/superhero-dex-backend/commit/73ad896680191adf2e555e52facdca11d1cb3f84))
* **validator:** resolve todos, move sorting to db ([6a8a6bd](https://www.github.com/unit214/superhero-dex-backend/commit/6a8a6bdcb8dca632a133e66d8a13d1149412669e))


### Testing

* add e2e tests for PairLiquidityInfoHistoryDbService and PairLiquidityInfoHistoryErrorDbService ([081bbb0](https://www.github.com/unit214/superhero-dex-backend/commit/081bbb056ea2369a901a24bec756cee931999d2f))
* add unit tests for PairLiquidityInfoHistoryController ([5bc2f8f](https://www.github.com/unit214/superhero-dex-backend/commit/5bc2f8f611d8e1f05ba5b9b80a878edee1a82a66))
* adjust isRunning logic, implement unit tests for TasksService ([2de9430](https://www.github.com/unit214/superhero-dex-backend/commit/2de94303441444e672ed4900c6737477f74e0a0a))
* implement unit tests for ImporterService ([774dfc9](https://www.github.com/unit214/superhero-dex-backend/commit/774dfc9aecfdec8bec5ca9c443e84c61e89faee9))
* implement unit tests for ValidatorService ([eb77794](https://www.github.com/unit214/superhero-dex-backend/commit/eb777947ffbd00dccec8254aabc7b2e8c098da6c))
* run test ci on pr lvl, fix e2e tests ([e0ee1cc](https://www.github.com/unit214/superhero-dex-backend/commit/e0ee1cce2f16148a5dac939d6f5ea0fe226f318b))

### [1.1.1](https://www.github.com/aeternity/dex-backend/compare/v1.1.0...v1.1.1) (2024-02-14)


### CI / CD

* change ops repo in prd pipelines ([1f5abcc](https://www.github.com/aeternity/dex-backend/commit/1f5abcc2b608a0227fedff022a00adf5ed96d864))
* fix token for checkout in prd pipelines ([62661c1](https://www.github.com/aeternity/dex-backend/commit/62661c1f196475956323bc6203aa55eeae1601b0))
* update node version in dockerfile ([6e26a98](https://www.github.com/aeternity/dex-backend/commit/6e26a98301d4870ab9515330e86b4a4e316472f4))

## [1.1.0](https://www.github.com/aeternity/dex-backend/compare/v1.0.1...v1.1.0) (2024-02-14)


### Features

* upgrades types to correct sdk types ([3233306](https://www.github.com/aeternity/dex-backend/commit/3233306099cd973f4494cb160aab497a0875cdfb))


### CI / CD

* add auth for repo checkout stg ([ffe7229](https://www.github.com/aeternity/dex-backend/commit/ffe7229b7080abbd8f33e2afcdbbd633cc1d5d25))
* change gitops repo for stg ([daff046](https://www.github.com/aeternity/dex-backend/commit/daff0464dfbb734b435368b3fbb8881f0681658c))
* change token key ([ed0fbc8](https://www.github.com/aeternity/dex-backend/commit/ed0fbc8dbc18cbe0c5087e1231a3dbfb5e8137d0))


### Miscellaneous

* update to sdk@13 ([1760101](https://www.github.com/aeternity/dex-backend/commit/1760101fe8e5b15ac2d815cecd27725cd45d462a))

### [1.0.1](https://www.github.com/aeternity/dex-backend/compare/v1.0.0...v1.0.1) (2023-04-26)


### Bug Fixes

* fix gitsha ([57e765c](https://www.github.com/aeternity/dex-backend/commit/57e765c06e29e2065b24df5503602558be774d38))


### CI / CD

* **build:** patch-deprecated-gh-action-steps ([70ce082](https://www.github.com/aeternity/dex-backend/commit/70ce0828b6f84982d6d949b3f96285aa10134b6b))
* change dockerfile to remove unused files and folders ([25dbffa](https://www.github.com/aeternity/dex-backend/commit/25dbffa209806bfd21fe9d38de570603b48844e4))
* check pr deployment state before sync ([8ed4de4](https://www.github.com/aeternity/dex-backend/commit/8ed4de44f50344bea7196f72365fc0349298c771))
* exclude and prisma folder from delete ([5b32ebc](https://www.github.com/aeternity/dex-backend/commit/5b32ebc5f70c5707691e64330a6b0b87d93a2f57))
* fix spelling ([5cdd9e2](https://www.github.com/aeternity/dex-backend/commit/5cdd9e2e6d892868dc90961f8b6aef75bdcf8874))


### Miscellaneous

* update to middleware v2 ([825019a](https://www.github.com/aeternity/dex-backend/commit/825019acd8d64af238faf5c39f03a3347aaf71d9))
* upgrades minor dependency versions ([5d4524f](https://www.github.com/aeternity/dex-backend/commit/5d4524fba2f2ace08e69c9ca6bfb026f0cd3818f))

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
