
# Dex Backend

## Local development

### Prerequisites
- [Node.js](https://nodejs.org/)
- Docker

### Setup DB & run the application
1. Install dependencies:
```bash
npm install
```
2. Run docker container with DB locally, this will also run the DB migrations
```bash
npm run db:start
```

3. Start the development server:
```bash
npm run serve:dev
```

### Database
#### Schema changes
This application uses Prisma as an ORM. To make changes to the DB schema, you need to update the schema in `prisma/schema.prisma`.
- For prototyping during development you can push the schema changes to the DB using:
    ```bash
    npm run db:push-schema
    ```
- Once the schema changes are ready to deploy, you can generate and apply a prisma migration file with the change using:
    ```bash
    prisma migrate dev --name <NAME_OF_YOUR_MIGRATION>
    ```

#### User defined PostgreSQL functions
This application uses user defined functions in the PostgreSQL database. These functions are defined in the `sql-functions` directory.
- For prototyping during development you can push the functions to the DB using:
    ```bash
    npm run db:push-functions
    ```
- Once the functions are ready to deploy you have to manually create an empty prisma migration for them using:
    ```bash
    prisma migrate dev --create-only --name <NAME_OF_YOUR_MIGRATION>
    ```
    Then, copy your sql code into the newly created migration file. Afterwards, apply the changes using `prisma migrate dev`

### Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

### Further commands for interacting with the DB container

```bash
# to start
npm run db:start

# to stop container
npm run db:stop

# to remove (will delete all db data)
npm run db:remove

# to reset (delete all data and recreate db)
npm run db:reset
```

### Further commands for running the app

```bash
# development
npm run serve

# watch mode
npm run serve:dev

# debug mode
npm run serve:debug

# production mode
npm run build
npm run serve:prod
```

