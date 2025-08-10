#!/bin/bash

cd ../../packages/db
npm install -g kysely-ctl
npm run db:migrate:prod
