#!/usr/bin/env bash
# One-time bootstrap of the first Let's Encrypt certificate for docker-compose.prod.yml.
# nginx cannot start with TLS before a certificate exists, and certbot needs nginx to answer the
# HTTP-01 challenge. So: create a throwaway certificate -> start nginx -> request the real one -> reload.
#
# Usage (on the VPS, from the repository root, after creating .env.production):
#   bash deploy/init-letsencrypt.sh
set -euo pipefail

if [ ! -f .env.production ]; then
  echo "Missing .env.production (copy .env.production.example and fill it in)." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.production
set +a

: "${DOMAIN:?DOMAIN is not set}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL is not set}"

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"
DATA_PATH="./deploy/certbot"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
# Set STAGING=1 to test against the Let's Encrypt staging CA (avoids rate limits).
STAGING_ARG=""
if [ "${STAGING:-0}" = "1" ]; then STAGING_ARG="--staging"; fi

mkdir -p "${DATA_PATH}/conf" "${DATA_PATH}/www"

echo "### Creating a temporary self-signed certificate for ${DOMAIN} ..."
${COMPOSE} run --rm --entrypoint "\
  sh -c 'mkdir -p ${CERT_DIR} && openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout ${CERT_DIR}/privkey.pem -out ${CERT_DIR}/fullchain.pem -subj /CN=localhost'" certbot

echo "### Starting nginx ..."
${COMPOSE} up -d --force-recreate nginx

echo "### Removing the temporary certificate ..."
${COMPOSE} run --rm --entrypoint "\
  sh -c 'rm -rf /etc/letsencrypt/live/${DOMAIN} /etc/letsencrypt/archive/${DOMAIN} /etc/letsencrypt/renewal/${DOMAIN}.conf'" certbot

echo "### Requesting the real certificate for ${DOMAIN} ..."
${COMPOSE} run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot ${STAGING_ARG} \
  --email ${LETSENCRYPT_EMAIL} -d ${DOMAIN} --rsa-key-size 4096 --agree-tos --no-eff-email --non-interactive" certbot

echo "### Reloading nginx ..."
${COMPOSE} exec nginx nginx -s reload

echo "Done. Start the rest of the stack with:  ${COMPOSE} up -d --build"
