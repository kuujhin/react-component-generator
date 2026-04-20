# AGENTS.md

Backend-specific rules for the Bun API server.

## Module Context

Bun HTTP server (port 3002) that proxies AI requests, manages API keys, and processes generated component code to ensure react-live compliance.

## Tech Stack & Constraints

- **Bun runtime** only (not Node.js)
- Fetch API for HTTP requests (not axios or other libraries)
- Plain JavaScript (no TypeScript runtime; TS compilation happens at build time only)
- CORS headers required for all responses
- Streaming not supported; return full responses

## Implementation Patterns

**System Prompt Governance**
- SYSTEM_PROMPT constant at top of file is the contract with AI
- Do NOT add/remove requirements without updating both system prompt and Golden Rules
- Prompt changes must be validated in development (manual testing required)

**Code Processing Pipeline**
- `stripMarkdownFences()`: Removes markdown fence artifacts from AI output
- `ensureRenderCall()`: Verifies final code includes `render(<ComponentName />)` call
- Both are defensive; do not skip or combine

**API Key Resolution**
- `resolveApiKey(provider, clientKey)`: Returns client key (if provided) or env key or null
- Never hardcode API keys or expose them in responses/logs
- Env keys checked at startup via ENV_KEYS object

**Provider Support Pattern**
- New providers added as: `callProvider(prompt: string, apiKey: string): Promise<string>`
- Return plain code string (post-processed by stripMarkdownFences + ensureRenderCall)
- Catch and rethrow provider errors with descriptive messages

## Testing Strategy

Manual testing required:
```bash
bun run server
# Test via curl or frontend UI

# Example: POST /api/generate
curl -X POST http://localhost:3002/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a button that counts clicks",
    "provider": "anthropic",
    "apiKey": "sk-ant-..."
  }'
```

Verify:
- Generated code has `render()` call at end
- No markdown fences in output
- No external imports in generated code
- CORS headers present in all responses

## Local Golden Rules

1. **System Prompt is Sacred**: Changes to SYSTEM_PROMPT ripple to all generated components. Update root AGENTS.md when changing it.

2. **Provider Errors Are User Errors**: Network timeouts, bad API keys, quota exceeded are not 500s. Return 400 with clear message.

3. **Code Validation Before Return**: Do not return code that violates react-live contract. Catch and reject at stripMarkdownFences + ensureRenderCall stage.

4. **No Streaming or Chunking**: Bun's streaming is complex; block on full response from AI, then return to client.

5. **CORS Headers on All Responses**: Missing CORS header breaks frontend. Check twice.
