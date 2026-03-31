# Frontend Deployment Commit + Programmatic Verification

## What
Commit the frontend deployment changes (API base URL switch, robots.txt) and verify the live deployment at ntd.lt programmatically via curl.

## Context
The NTD frontend has been deployed to the VPS at ntd.lt with password protection (Basic Auth: ntd/1007). The API backend is live at api.ntd.lt. This brief captures the commit and runs automated verification that everything is wired correctly.

## Steps

### 1. Verify .env.production exists
The file should already exist at `~/dev/ntd/.env.production` with:
```
PUBLIC_API_BASE=https://api.ntd.lt
```
If it doesn't exist, create it.

### 2. Verify robots.txt exists
The file should already exist at `~/dev/ntd/public/robots.txt` with:
```
User-agent: *
Disallow: /
```
If it doesn't exist, create it.

### 3. Commit and push
```bash
cd ~/dev/ntd
git add -A
git commit -m "Deploy to ntd.lt: switch API base to api.ntd.lt, add robots.txt disallow, add .env.production"
git push
```

### 4. Programmatic deployment verification
Run these curl checks and report pass/fail for each:

```bash
# Test 1: Frontend responds with 401 (password gate active)
curl -sI https://ntd.lt 2>&1 | head -5
# PASS: shows HTTP/2 401 or HTTP/1.1 401

# Test 2: Frontend loads with credentials
curl -su ntd:1007 https://ntd.lt 2>&1 | head -20
# PASS: shows HTML with "NT Duomenys" or "ntd" content

# Test 3: robots.txt accessible without auth
curl -s https://ntd.lt/robots.txt 2>&1
# PASS: shows "User-agent: *\nDisallow: /"

# Test 4: QuickScan page loads
curl -su ntd:1007 https://ntd.lt/quickscan/ 2>&1 | head -10
# PASS: shows HTML content (not 404)

# Test 5: API health endpoint (no auth needed)
curl -s https://api.ntd.lt/health 2>&1
# PASS: shows {"ok":true}

# Test 6: API docs protected
curl -sI https://api.ntd.lt/docs 2>&1 | head -5
# PASS: shows 401

# Test 7: CORS header present for ntd.lt origin
curl -sI -H "Origin: https://ntd.lt" -X OPTIONS https://api.ntd.lt/v1/quickscan-lite/report 2>&1 | grep -i access-control
# PASS: shows Access-Control-Allow-Origin containing ntd.lt

# Test 8: SSL valid (no certificate errors)
curl -sI https://ntd.lt 2>&1 | grep -i strict
curl -sI https://api.ntd.lt/health 2>&1 | grep -i strict
# PASS: both show Strict-Transport-Security or no SSL errors

# Test 9: No bustodnr in frontend build
curl -su ntd:1007 https://ntd.lt 2>&1 | grep -i bustodnr
curl -su ntd:1007 https://ntd.lt/quickscan/ 2>&1 | grep -i bustodnr
# PASS: no matches (bustodnr brand completely removed from customer-facing content)

# Test 10: API base URL correctly set in JS bundle
curl -su ntd:1007 -s https://ntd.lt/_astro/ 2>&1 | grep -o "api.ntd.lt" | head -1
# Or find the JS file and check:
curl -su ntd:1007 -s https://ntd.lt/quickscan/ | grep -o 'src="[^"]*QuickScan[^"]*"' | head -1
# Then fetch that JS file and verify api.ntd.lt is present
# PASS: api.ntd.lt found in the JS bundle
```

### 5. Report results
Print a summary table:
```
| # | Check                        | Result |
|---|------------------------------|--------|
| 1 | Frontend 401 (auth gate)     | PASS/FAIL |
| 2 | Frontend loads with creds    | PASS/FAIL |
| 3 | robots.txt no-auth           | PASS/FAIL |
| 4 | /quickscan/ loads            | PASS/FAIL |
| 5 | API health                   | PASS/FAIL |
| 6 | API docs protected           | PASS/FAIL |
| 7 | CORS for ntd.lt              | PASS/FAIL |
| 8 | SSL valid                    | PASS/FAIL |
| 9 | No bustodnr in frontend      | PASS/FAIL |
| 10| api.ntd.lt in JS bundle      | PASS/FAIL |
```

## Constraints
- Do NOT change any source code other than creating .env.production and robots.txt if missing
- The curl tests hit the live server — they verify the actual deployment, not local files
- Basic auth credentials: username `ntd`, password `1007`
- If any test fails, report which one and the actual output — do not attempt to fix server config

## Files to touch
- `~/dev/ntd/.env.production` — verify exists or create
- `~/dev/ntd/public/robots.txt` — verify exists or create
- Git commit + push

## Run from
```bash
cd ~/dev/ntd
```