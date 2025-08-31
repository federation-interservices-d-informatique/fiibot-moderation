#!/usr/bin/env sh
set -e

NODE_PATH="${PWD}/node_modules" bun "${PWD}/docker/wait-for-postgres.js"
echo "Starting bot!"
bun run --watch src/index.ts