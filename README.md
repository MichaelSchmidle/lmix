# LMiX 

> Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.

📦 **Ready to run LMiX?** Get started with our [deployment repository](https://github.com/MichaelSchmidle/lmix-deploy) for a one-command setup of the complete stack.

## Overview 🌟

LMiX is not just another AI chat interface - it's a platform for orchestrating rich productions between multiple AI assistants, each with their own role, perspective, and knowledge state. Think of it as a theater where you're the director, but your actors can evolve beyond their initial roles and even break the fourth wall.

## Core Concepts 🎯

### Worlds
Define the stage for your productions:
- Unique settings and rules
- Physical laws, environmental conditions, and social norms

### Personas
Create assistants with three layers of truth:
- Universal (what's universally true about a given persona)
- Internal (what's true only for a given persona)
- External (what's true only for other personas about a given persona)

### Scenarios
Bring it all together with natural language descriptions of:
- Current situation and starting point
- Instructions shared by all assistants

## Unique Features 🚀

### Beyond Characters
Assistants can play diverse roles:
- Visible traditional character personas
- Invisible destiny masters orchestrating future events or inexplicable forces shaping the world
- Production helpers setting a scene or summarizing episodes

### Dynamic Interactions
- Natural conversation flow with multiple participants
- Fourth wall breaks with meta-commentaries
- Temporal perspective shifts
- Branching conversations and alternative takes

### Director Controls
- Select assistants to take turns
- Branch into alternative conversation paths
- Regenerate turns using different assistants

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

Core dependencies include NuxtUI and FormKit for the interface, the OpenAI library for LLM integration, and Pinia for state management. Development emphasizes type safety, optimistic UI updates, and comprehensive testing with Vitest and Playwright. While supporting multiple users through Supabase's Auth and Row Level Security features, LMiX remains focused on single-user scenarios in local deployments.

More details are documented in the [LMiX Architecture](/docs/architecture.md).

## Container Build Process 🐳

The LMiX application container is automatically built and published to GitHub Container Registry (GHCR) on every `v*` tag creation. The container includes:

1. The built LMiX application
2. Supabase CLI for database management
3. Supabase migration files
4. Startup script that:
   - Waits for database availability
   - Applies pending migrations
   - Starts the application

## Database Migrations 🗃️

Migrations are managed using Supabase CLI and stored in the `supabase/migrations` directory. The workflow:

1. Development:
   ```bash
   # Create a new migration
   npm run dev:migration
   
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

## Local Development 🚧

1. Install the prerequisites:
   - Node.js 20+ LTS
   - Docker Desktop
   - Supabase ([local instance](https://supabase.com/docs/guides/local-development))
2. Clone the repository:
   ```bash
   git clone --recurse-submodules https://github.com/MichaelSchmidle/lmix
   cd lmix
   ```
3. Configure your environment:
   Copy the file `default.env` to a `.env.development`, then edit it where necessary to match your desired configuration.
4. Install dependencies:
   ```bash
   npm i
   ```
5. Start the Supabase instance and Nuxt development server:
   ```bash
   npx supabase start
   npm run dev
   ```
6. Access LMiX:
   Create a test user in [Supabase Studio](http://localhost:5643/project/default/auth/users). Then, open the [LMiX web interface](http://localhost:5649) and finally: happy developing!

### Building and Testing Locally

1. Run tests against the development environment:
   ```bash
   npm test
   ```
2. Run E2E tests:
   ```bash
   npm run test:e2e
   ```
3. Build and test the Docker container:
   ```bash
   docker compose --build -d
   ```
   This will build the deployment container with the latest development code, available at `http://localhost:{LMIX_PORT}` (default port: `5649` for `LMiX` on the numpad).

## Contributing 🤝

Whether you're a developer, writer, or just someone with amazing ideas, we'd love your help in pushing the boundaries of what's possible with AI interactions.

## License

LMiX is licensed under the [MIT License](/LICENSE).

---

*LMiX: Where every conversation is a new story waiting to unfold.*
