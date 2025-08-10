#!/bin/bash

cd ../../packages/db
npm install
npm run db:migrate:prod
