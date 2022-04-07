
## Description

[Dex-Backend](https://github.com/aeternity/dex-backend)

## Installation

```bash
$ npm install
```

## Databse
```
# after any schema definition change run
$ npm install

# or

$ npx prisma generate
```

## Container
```
# to deploy
npm run db:deploy

# to stop container
npm run db:stop

#to remove / reset container (this helps to erase db also)
npm run db:remove

#if you want to run the container into interactive mode
npm run db

#WARNING: if container runs in interactive mode for the first time run from other terminal :
$ npm run db:push-schema

```

## Running the app

```bash
# development
$ npm run serve

# watch mode
$ npm run serve:dev

# production mode
$ npm run serve:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
