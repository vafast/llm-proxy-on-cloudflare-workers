#!/bin/bash
# 透传接口真实测试（需先启动 npm run dev）
# 用法: ./test/integration/passthrough-http.sh

set -e
cd "$(dirname "$0")/../.."

# 加载 .env.development
if [ -f .env.development ]; then
  set -a
  source .env.development
  set +a
fi

BASE="http://localhost:8787"
[ -n "$PROXY_API_KEY" ] || { echo "PROXY_API_KEY 未配置"; exit 1; }

echo "=== 1. 无透传（使用 env OPENAI_API_KEY）==="
code=$(curl -s -o /tmp/out1.json -w "%{http_code}" -X POST "$BASE/openai/v1/chat/completions" \
  -H "Authorization: Bearer $PROXY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}')
echo "HTTP $code"
[ "$code" = "200" ] && echo "✓ 成功" || { cat /tmp/out1.json | head -5; echo "✗ 失败"; }

echo ""
echo "=== 2. 透传 X-OpenAI-Key（使用 env 有效 key）==="
code=$(curl -s -o /tmp/out2.json -w "%{http_code}" -X POST "$BASE/openai/v1/chat/completions" \
  -H "Authorization: Bearer $PROXY_API_KEY" \
  -H "X-OpenAI-Key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}')
echo "HTTP $code"
[ "$code" = "200" ] && echo "✓ 透传成功" || { cat /tmp/out2.json | head -5; echo "✗ 透传失败"; }

echo ""
echo "=== 3. 透传 X-OpenAI-Key（无效 key）→ 应 401 ==="
code=$(curl -s -o /tmp/out3.json -w "%{http_code}" -X POST "$BASE/openai/v1/chat/completions" \
  -H "Authorization: Bearer $PROXY_API_KEY" \
  -H "X-OpenAI-Key: sk-invalid-passthrough-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}')
echo "HTTP $code"
[ "$code" = "401" ] && echo "✓ 透传生效（无效 key 被拒绝）" || { cat /tmp/out3.json | head -5; echo "预期 401"; }
