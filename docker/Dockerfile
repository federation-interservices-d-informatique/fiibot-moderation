FROM node:18-alpine3.17 as build
WORKDIR /app/bot

COPY ./src ./src
COPY ./*.json ./
COPY ./docker/entrypoint.sh ./
COPY ./docker/healthcheck.sh ./
COPY ./docker/wait-for-postgres.js ./

RUN npm install
RUN npx tsc
RUN rm -rf node_modules
RUN npm ci --production

FROM node:18-alpine3.17 as prod
WORKDIR /usr/src/bot

RUN apk add --no-cache curl
RUN adduser -D -H bot bot

COPY --from=build --chown=bot:bot /app/bot/package.json ./package.json
COPY --from=build --chown=bot:bot /app/bot/package-lock.json ./package-lock.json
COPY --from=build --chown=bot:bot /app/bot/node_modules ./node_modules
COPY --from=build --chown=bot:bot /app/bot/dist ./dist
COPY --from=build --chown=bot:bot /app/bot/entrypoint.sh ./
COPY --from=build --chown=bot:bot /app/bot/wait-for-postgres.js ./
COPY --from=build --chown=bot:bot /app/bot/healthcheck.sh ./

USER bot

ENV NODE_ENV production
HEALTHCHECK --interval=1m --timeout=10s --start-period=5s --retries=3 \
    CMD [ "/usr/src/bot/healthcheck.sh" ]
ENTRYPOINT [ "/usr/src/bot/entrypoint.sh" ]
