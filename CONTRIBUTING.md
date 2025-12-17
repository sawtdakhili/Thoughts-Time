# Contributing to Thoughts & Time

Thank you for your interest in contributing! This guide will help you get started with local development.

## Development Setup

### Prerequisites

- **Node.js** 20+ and npm
- **Git**
- A code editor (VS Code recommended)

### Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/sawtdakhili/Thoughts-Time.git
cd Thoughts-Time
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables** (optional, for Supabase features)
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. **Start the development server**
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:5173)

# Build
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests with Vitest
npm run test:ui      # Vitest with UI
npm run test:coverage # Test coverage report
npm run test:e2e     # Playwright end-to-end tests
npm run test:e2e:ui  # Playwright with UI

# Linting & Formatting
npm run lint         # ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

## Project Structure

```
src/
├── components/     # React components
├── store/          # Zustand stores (state management)
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── services/       # External services (Supabase sync)
├── lib/            # External integrations
├── constants/      # App constants
├── types.ts        # TypeScript type definitions
└── App.tsx         # Root component

e2e/                # Playwright end-to-end tests
scripts/            # Docker and deployment scripts
```

## Code Conventions

### Component Patterns
- Functional components with hooks
- Props interfaces defined inline or in types.ts
- Event handlers prefixed with `handle` (e.g., `handleSubmit`)
- Tailwind classes for styling

### File Naming
- Components: PascalCase (`ItemDisplay.tsx`)
- Utilities: camelCase (`parser.ts`)
- Tests: Same name with `.test.ts(x)` suffix

### State Management
- Use store actions for state changes
- `skipHistory` flag prevents recording during undo/redo
- Record history before mutations for proper undo

## Testing Guidelines

### Unit Tests (Vitest)
- Located alongside source files (`*.test.ts`)
- Use `@testing-library/react` for component tests
- Aim for meaningful coverage, not just numbers

### E2E Tests (Playwright)
- Located in `e2e/` directory
- Test critical user flows
- Keep tests independent and idempotent

## Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Write clear, concise commit messages
- Add tests for new functionality
- Update documentation as needed

3. **Run tests and build**
```bash
npm run test
npm run build
```

4. **Commit with conventional commits**
```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in component"
git commit -m "docs: update README"
```

5. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:
- Clear description of changes
- Screenshots/videos for UI changes
- Test results
- Any breaking changes noted

## Important Guidelines

### What to Include
- ✅ Tests for new features
- ✅ TypeScript types (no `any` unless absolutely necessary)
- ✅ Accessibility considerations (ARIA labels, keyboard navigation)
- ✅ Mobile responsive design
- ✅ Documentation updates

### What to Avoid
- ❌ Breaking changes without discussion
- ❌ Removing tests or reducing coverage
- ❌ Large refactors without prior approval
- ❌ Adding heavy dependencies without justification
- ❌ Committing sensitive data (.env files, API keys)

## Code Style

We use:
- **Prettier** for code formatting (runs on pre-commit)
- **ESLint** for linting
- **TypeScript** strict mode

The pre-commit hook will automatically format your code, but you can also run:
```bash
npm run format
```

## Getting Help

- **Documentation**: Check [CLAUDE.md](CLAUDE.md) for project context
- **Roadmap**: See [ROADMAP.md](ROADMAP.md) for planned features
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.

---

**Thank you for contributing to Thoughts & Time!** 🙏
