curl -X POST http://localhost:3000/api/v1/chat \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "123e4567-e89b-12d3-a456-426614174000",
       "messages": [{"role": "user", "content": "Write a haiku about TypeScript"}],
       "model": "gpt-4o-mini"
     }'
