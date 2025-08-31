FROM oven/bun:1-alpine as build
WORKDIR /app/bot

COPY ./src ./src
COPY ./*.json ./
COPY ./docker/entrypoint.sh ./
COPY ./docker/healthcheck.sh ./
COPY ./docker/wait-for-postgres.js ./

RUN bun install --production

FROM oven/bun:1-alpine as prod
WORKDIR /usr/src/bot

RUN apk add --no-cache curl
RUN adduser -D -H bot bot

COPY --from=build --chown=bot:bot /app/bot/package.json ./package.json
COPY --from=build --chown=bot:bot /app/bot/node_modules ./node_modules
COPY --from=build --chown=bot:bot /app/bot/src ./src
COPY --from=build --chown=bot:bot /app/bot/entrypoint.sh ./
COPY --from=build --chown=bot:bot /app/bot/wait-for-postgres.js ./
COPY --from=build --chown=bot:bot /app/bot/healthcheck.sh ./

USER bot

ENV NODE_ENV production
HEALTHCHECK --interval=1m --timeout=10s --start-period=5s --retries=3 \
    CMD [ "/usr/src/bot/healthcheck.sh" ]
ENTRYPOINT [ "/usr/src/bot/entrypoint.sh" ]
