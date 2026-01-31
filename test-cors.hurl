# Test 1: CORS OPTIONS preflight request (simulating browser preflight)
OPTIONS http://localhost:8025/api/v2/messages?start=0&limit=50
Origin: http://localhost:5173
Access-Control-Request-Method: GET
Access-Control-Request-Headers: authorization,content-type

HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" exists
header "Access-Control-Allow-Methods" exists
header "Access-Control-Allow-Headers" exists
header "Access-Control-Allow-Origin" == "*"
header "Access-Control-Allow-Methods" contains "GET"
header "Access-Control-Allow-Methods" contains "OPTIONS"
header "Access-Control-Allow-Headers" matches "(?i)authorization"
header "Access-Control-Allow-Headers" matches "(?i)content-type"

# Test 2: Actual GET request with CORS headers
GET http://localhost:8025/api/v2/messages?start=0&limit=50
Origin: http://localhost:5173

HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" == "*"
jsonpath "$.total" exists
jsonpath "$.count" exists
jsonpath "$.start" == 0
jsonpath "$.items" exists
