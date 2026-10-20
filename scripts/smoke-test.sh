#!/usr/bin/env bash
# Smoke test: wait for the server, then make sure the key pages and APIs answer correctly.
# Usage: scripts/smoke-test.sh http://127.0.0.1:3000
set -u
BASE="${1:-http://127.0.0.1:3000}"

echo "Waiting for $BASE/api/health ..."
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null "$BASE/api/health"; then break; fi
  sleep 1
  if [ "$i" = 60 ]; then echo "Server did not become healthy in 60s"; exit 1; fi
done

fail=0
check() { # path expected_status
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$1")
  if [ "$code" = "$2" ]; then echo "ok   $code $1"; else echo "FAIL $code (expected $2) $1"; fail=1; fi
}

check /                      200
check /shop                  200
check /cart                  200
check /checkout              200
check /login                 200
check /faq                   200
check /contact               200
check /track-order           200
check /page/about            200
check /api/health            200
check /api/products          200
check /api/categories        200
check /api/settings          200
check /sitemap.xml           200
check /robots.txt            200
check /product/wireless-nc-headphones 200
check /page/does-not-exist   404
check /product/does-not-exist 404
check /api/orders            401
check /api/admin/counts      401

exit $fail
