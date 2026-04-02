#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:?BASE_URL is required}"
BASE_URL="${BASE_URL%/}"
SMOKE_USER_EMAIL="${SMOKE_USER_EMAIL:?SMOKE_USER_EMAIL is required}"
SMOKE_USER_PASSWORD="${SMOKE_USER_PASSWORD:?SMOKE_USER_PASSWORD is required}"

normalize_http_code() {
  local raw digits
  raw="${1:-}"
  digits="$(printf '%s' "$raw" | tr -cd '0-9')"

  if [[ ${#digits} -ge 3 ]]; then
    printf '%s' "${digits: -3}"
  else
    printf '%s' "$digits"
  fi
}

response_has_access_token() {
  jq -e '.access.token | strings | length > 0' "$response_file" >/dev/null 2>&1
}

curl -fsS "$BASE_URL/health/ready" >/dev/null

for endpoint_var in IDENTITY_READY_URL FLIGHT_READY_URL PASSENGER_READY_URL BOOKING_READY_URL PAYMENT_READY_URL; do
  endpoint="${!endpoint_var:-}"
  if [[ -n "$endpoint" ]]; then
    curl -fsS "$endpoint" >/dev/null
  fi
done

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

login_payload="$(jq -nc \
  --arg email "$SMOKE_USER_EMAIL" \
  --arg password "$SMOKE_USER_PASSWORD" \
  '{email: $email, password: $password}')"

login_status_raw="$(
  curl -sS -o "$response_file" -w '%{http_code}' \
    -H 'Content-Type: application/json' \
    -X POST \
    -d "$login_payload" \
    "$BASE_URL/api/v1/identity/login"
)"
login_status="$(normalize_http_code "$login_status_raw")"

if ! response_has_access_token; then
  echo "Smoke login failed (status: ${login_status:-unknown})" >&2
  cat "$response_file" >&2
  exit 1
fi

access_token="$(jq -r '.access.token // empty' "$response_file")"

if [[ -z "$access_token" ]]; then
  echo "Smoke login response did not include an access token" >&2
  cat "$response_file" >&2
  exit 1
fi

curl -fsS \
  -H "Authorization: Bearer $access_token" \
  "$BASE_URL/api/v1/user/me" >/dev/null

echo "Smoke checks passed"
