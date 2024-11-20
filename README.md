# LMiX 🎭

> Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.

📦 **Ready to run LMiX?** Get started with our [deployment repository](https://github.com/MichaelSchmidle/lmix-deploy) for a one-command setup of the complete stack.

## Overview 🌟

LMiX is not just another AI chat interface - it's a platform for orchestrating rich productions between multiple AI assistants, each with their own role, perspective, and knowledge state. Think of it as a theater where you're the director, but your actors can evolve beyond their initial roles and even break the fourth wall.

## Core Concepts 🎯

### Worlds
Define the stage for your productions:
- Settings and rules
- Physical laws
- Universal truths
- Environmental conditions

### Personas
Create assistants with:
- Self-perception (how they view themselves)
- Public perception (how others view them)
- Hidden capabilities and knowledge
- Ability to evolve through productions

### Scenarios
Bring it all together with natural language descriptions of:
- Current situation
- Relations and tensions
- Hidden agendas
- Stakes and motivations

## Unique Features 🚀

### Beyond Characters
Assistants can play diverse roles:
- Visible traditional character personas
- Invisible destiny masters orchestrating future events
- Meta-commentators providing analysis

### Dynamic Interactions
- Natural conversation flow with multiple participants
- Fourth wall breaks and meta-commentary
- Temporal perspective shifts
- Hidden state tracking and evolution
- Branching conversations and alternative takes

### Director Controls
- Mention (@) assistants to select speakers
- Choose between story and meta modes
- Review past events from new perspectives
- Branch into alternative conversation paths
- Set up destiny points for inevitable outcomes

## Use Cases 🎬

The possibilities are endless:
- Interactive storytelling
- Training simulations
- Educational scenarios
- Role-playing games
- Creative writing
- Psychological exploration
- Historical reenactments

## Technical Implementation 🛠

LMiX is a local-first web application built with Nuxt, using Supabase as backend and TypeScript as programming language. It follows a minimalist approach to data structures while leveraging natural language for flexibility. The application primarily runs in a localhost environment, designed to integrate with locally running LLMs, and can be deployed via Docker.

Core dependencies include NuxtUI for the interface, Vercel's AI SDK for LLM integration, and Pinia for state management. Development emphasizes type safety, optimistic UI updates, and comprehensive testing with Vitest and Playwright. While supporting multiple users through Supabase's OAuth and Row Level Security, LMiX remains focused on single-user scenarios in local deployments.

More details are documented in the [LMiX Architecture](/docs/architecture.md).

## Container Build Process 🐳

The LMiX application container is automatically built and published to GitHub Container Registry (GHCR) on every push to main and tag creation. The container includes:

1. The built LMiX application
2. Supabase CLI for database management
3. Migration files from the supabase/ directory
4. Startup script that:
   - Waits for database availability
   - Applies pending migrations
   - Starts the application

### Manual Build

To build the container locally:

```bash
# Build the container
docker build -t lmix .

# Run with required environment variables
docker run -p 3000:3000 \
  -e SUPABASE_DB_HOST=localhost \
  -e SUPABASE_DB_PASSWORD=your-password \
  lmix
```

## Database Migrations 🗃️

Migrations are managed using Supabase CLI and stored in the `supabase/migrations` directory. The workflow:

1. Development:
   ```bash
   # Create a new migration
   supabase migration new my_migration
   
   # Apply migrations locally
   supabase db push
   ```

2. Deployment:
   - Migrations are packaged in the LMiX container
   - Automatically applied on container startup
   - Applied in order based on timestamps
   - Safe to run multiple times (idempotent)

## Development Workflow 🔄

### Branch Strategy

We follow a trunk-based development workflow:

- `main`: Production-ready code
- `feature/*`: New features and enhancements
- `fix/*`: Bug fixes
- `release/*`: Release preparation

### Pull Request Process

1. Create a branch following the naming convention
2. Implement changes with appropriate tests
3. Submit PR with:
   - Clear description of changes
   - Link to related issue(s)
   - Test coverage report
   - Screenshots for UI changes
4. Require at least one approval
5. Ensure CI checks pass
6. Squash and merge

### Code Review Guidelines

- Review within 24 hours
- Focus on:
  - Code quality and standards
  - Test coverage
  - Performance implications
  - Security considerations
- Use constructive feedback
- Resolve all comments before merge

### Release Process

1. Create `release/*` branch
2. Update version numbers
3. Generate changelog
4. Create release PR
5. After approval, merge to main
6. Tag release
7. Deploy to production

## Contributing 🤝

Whether you're a developer, writer, or just someone with amazing ideas, we'd love your help in pushing the boundaries of what's possible with AI interactions.

### Getting Started 🚀

Prerequisites:
- Git
- Docker
- Node.js (LTS)

1. Clone and install:
   ```bash
   git clone --recurse-submodules https://github.com/MichaelSchmidle/lmix
   cd lmix
   npm i
   ```
2. Set up environment:
   ```bash
   npx supabase init && npx supabase start
   cp default.env .env
   # Edit .env with your Supabase credentials
   ```
3. Start development:
   ```bash
   npm run dev
   ```

Tests: `npm test`
E2E Tests: `npm run test:e2e`

## License

LMiX is licensed under the [MIT License](/LICENSE).

---

*LMiX: Where every conversation is a new story waiting to unfold.*
