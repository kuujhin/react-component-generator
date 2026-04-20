# AGENTS.md

This file provides operational rules and constraints for agents working on this React Component Generator project.

## Operational Commands

Critical commands for development workflow:

```bash
bun install              # Install dependencies
bun run dev             # Start frontend (Vite) + backend (Bun) concurrently
bun run server          # Run backend only (with watch mode)
bun run build           # Compile TypeScript + build production bundle
bun run lint            # Run ESLint checks
bun preview             # Preview production build locally
```

Use `bun` exclusively—never use npm, yarn, or pnpm.

## Golden Rules

### Frontend + React Component Generation

1. **react-live Contract**: Generated components must strictly comply with react-live requirements:
   - Inline styles only (no CSS imports, no external stylesheets)
   - Self-contained (no npm packages beyond React)
   - Plain JavaScript only (no TypeScript in generated code)
   - Call `render(<ComponentName />)` at the end
   - React is globally available

2. **Code Generation Must Never**:
   - Import external libraries dynamically
   - Reference process.env or global variables
   - Use async/await at module level
   - Export functions; use inline render()

3. **Styling System**:
   - Components use only inline `style={}` objects
   - Design tokens available in App.css (--c-bg, --c-green-hi, --glow-green, etc.)
   - Do not generate new CSS classes

### Backend + AI Integration

1. **System Prompt Governance**:
   - All component prompts sent to AI must enforce react-live constraints
   - System prompt in `server/index.ts` is the source of truth
   - Update system prompt when react-live requirements change

2. **Provider Integration**:
   - Support both Anthropic and Google Gemini APIs
   - API keys sourced from .env or UI input
   - No hardcoded API keys
   - Graceful fallback if provider unavailable

3. **Error Handling**:
   - Catch AI generation failures and return user-friendly messages
   - Do not expose API keys in error messages or logs
   - Validate generated code before sending to frontend

### Code Quality Standards

1. ESLint rules in `eslint.config.js` are non-negotiable
2. TypeScript strict mode enabled
3. No `any` types without explicit `// @ts-ignore` with justification
4. All public API routes require proper error handling

## Project Context

React-based component generator that takes user prompts and uses AI (Anthropic or Google Gemini) to generate interactive React components in real-time with live preview via react-live.

**Tech Stack**: React 19, TypeScript 5.9, Vite 8, Bun runtime, react-live 4.1

## Standards & References

### Git Strategy

Use conventional commits with Korean prefixes (defined in `.claude/skills/commit/`):
- `feat:` - New features
- `fix:` - Bug fixes
- `style:` - Styling only
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Test additions

All commits must include `Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>` footer.

### Maintenance Policy

If observed code behavior conflicts with these rules, propose an update. This document is living—keep it aligned with actual project practice.
