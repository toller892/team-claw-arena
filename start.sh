#!/bin/sh
echo "Running database migration..."
npx prisma db push --accept-data-loss || echo "DB push failed, continuing..."
echo "Starting server..."
node server.js
