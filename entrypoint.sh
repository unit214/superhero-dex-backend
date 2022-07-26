#!/bin/sh

set -e
export npm_package_version=$(cat npm_version.txt)
export DATABASE_URL="postgresql://$POSTGRES_USERNAME:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DATABASE?schema=$POSTGRES_SCHEMA"
#npm run serve:prod
node dist/main.js
