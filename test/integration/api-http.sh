#!/bin/bash
# 接口真实测试（需先启动 npm run dev）
# 用法: ./test/integration/api-http.sh [BASE_URL]
# 示例: ./test/integration/api-http.sh
#       ./test/integration/api-http.sh http://localhost:8787

set -e
cd "$(dirname "$0")/../.."

# 加载 .env.development
if [ -f .env.development ]; then
  set -a
  source .env.development
  set +a
fi

BASE="${1:-http://localhost:8787}"
PASS=0
FAIL=0

run_test() {
  local name="$1"
  local expected_code="$2"
  shift 2
  local code
  code=$(curl -s -o /tmp/api_out.json -w "%{http_code}" "$@")
  if [ "$code" = "$expected_code" ]; then
    echo "✓ $name (HTTP $code)"
    ((PASS++)) || true
    return 0
  else
    echo "✗ $name (期望 $expected_code, 实际 $code)"
    [ -s /tmp/api_out.json ] && head -10 /tmp/api_out.json
    ((FAIL++)) || true
    return 1
  fi
}

echo "=== 接口真实测试: $BASE ==="
echo ""

# 检查服务是否可达
if ! curl -sf --connect-timeout 2 "$BASE/ping" >/dev/null 2>&1; then
  echo "错误: 无法连接 $BASE，请先启动服务: npm run dev"
  exit 1
fi

# 检查 PROXY_API_KEY
[ -n "$PROXY_API_KEY" ] || { echo "PROXY_API_KEY 未配置，请检查 .env.development"; exit 1; }

AUTH="Authorization: Bearer $PROXY_API_KEY"

# 1. /ping 无鉴权
echo "--- 公开路由 ---"
run_test "/ping 无鉴权" "200" -s -X GET "$BASE/ping"
echo ""

# 2. /status 需鉴权
echo "--- 健康检查 ---"
run_test "/status 需鉴权" "200" -s -X GET "$BASE/status" -H "$AUTH"
run_test "/status 无鉴权应 401" "401" -s -X GET "$BASE/status"
echo ""

# 3. /models
echo "--- Models ---"
run_test "GET /models" "200" -s -X GET "$BASE/models" -H "$AUTH"
run_test "GET /v1/models" "200" -s -X GET "$BASE/v1/models" -H "$AUTH"
echo ""

# 4. Chat Completions（/chat/completions 路径，model 含 provider）
echo "--- Chat Completions（统一路径）---"
run_test "POST /chat/completions" "200" -s -X POST "$BASE/chat/completions" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}'
run_test "POST /v1/chat/completions" "200" -s -X POST "$BASE/v1/chat/completions" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}'
echo ""

# 5. Proxy 透传（/openai/v1/chat/completions）
echo "--- Proxy 透传 ---"
run_test "POST /openai/v1/chat/completions 无透传" "200" -s -X POST "$BASE/openai/v1/chat/completions" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}'

if [ -n "$OPENAI_API_KEY" ]; then
  run_test "POST /openai/v1/chat/completions 透传 X-OpenAI-Key" "200" -s -X POST "$BASE/openai/v1/chat/completions" \
    -H "$AUTH" -H "X-OpenAI-Key: $OPENAI_API_KEY" -H "Content-Type: application/json" \
    -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}'
  run_test "透传无效 key 应 401" "401" -s -X POST "$BASE/openai/v1/chat/completions" \
    -H "$AUTH" -H "X-OpenAI-Key: sk-invalid-passthrough-key" -H "Content-Type: application/json" \
    -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}'
else
  echo "  (跳过透传测试: OPENAI_API_KEY 未配置)"
fi
echo ""

# 6. /key/:keySpec 前缀
echo "--- API Key 指定 ---"
run_test "GET /key/0/models 指定 key 索引" "200" -s -X GET "$BASE/key/0/models" -H "$AUTH"
echo ""

# 汇总
echo "=== 汇总: $PASS 通过, $FAIL 失败 ==="
[ "$FAIL" -eq 0 ] || exit 1
