# Contributing to LMiX

Thanks for your interest in contributing! This guide covers the development setup and guidelines.

## 🛠️ Development Setup

### Prerequisites

- **[Node.js](https://nodejs.org/)** (18.0.0+)
- **[Docker](https://www.docker.com/)**
- **[Bun](https://bun.sh/)** (or npm/pnpm/yarn)
- **[mkcert](https://mkcert.dev/)**

### Getting Started

```bash
# Clone the repository
git clone https://github.com/MichaelSchmidle/lmix.git
cd lmix

# Copy environment template
cp .env.example .env

# Install dependencies
bun install

# Start infrastructure services
bun run infra:start

# Run development server
bun run dev
```

Visit `https://app.localhost` to see the application.

## 🐳 Infrastructure Commands

```bash
# Infrastructure management
bun run infra:start    # Start all containers
bun run infra:stop     # Stop all containers
bun run infra:restart  # Restart infrastructure
bun run infra:logs     # View container logs
bun run infra:status   # Check container status

# Database operations
bun run db:generate    # Generate database migrations
bun run db:migrate     # Run database migrations
bun run db:studio      # Open Drizzle Studio
```

## 🧪 Quality Tools

```bash
bun run typecheck    # Type checking
bun run lint         # Code linting
bun run lint:fix     # Auto-fix issues
bun run check        # Run all checks
```

## 🏗️ Project Structure

```
lmix/
├── app/                    # Nuxt application
│   ├── components/         # Vue components
│   ├── pages/              # Route pages
│   └── ...
├── docs/                   # Documentation
│   ├── vision.md           # Product vision
│   └── specification.md    # Implementation specs
├── deployment/             # Infrastructure configuration
│   ├── docker-compose.yml      # Base services
│   ├── docker-compose.dev.yml  # Development overrides
│   └── scripts/                # Setup automation
├── server/                 # API and database
│   ├── api/                # API routes
│   ├── database/           # Schema and migrations
│   ├── middleware/         # Server middleware
│   └── utils/              # Server utilities
└── .env                    # Configuration
```

## 🔍 Available Services (Development)

After running `bun run infra:start`:

- **`https://app.localhost`**: Main application
- **`https://auth.localhost`**: Zitadel authentication
- **`https://proxy.localhost:8080`**: Traefik dashboard

## 📖 Architecture

LMiX is built with:

- **Frontend**: Nuxt 4 + Nuxt UI 3
- **Backend**: Nitro server with PostgreSQL
- **Auth**: Zitadel OIDC via nuxt-oidc-auth
- **Database**: PostgreSQL with Row-Level Security
- **Infrastructure**: Docker Compose + Traefik

### Key Concepts

- **Natural Language → Structured Knowledge**: Users write scenarios in plain English, system builds knowledge graphs
- **Asymmetric Knowledge**: Each assistant has unique, limited perspective
- **Affiliations**: Organizations with shared secrets enable complex knowledge networks

## 🚀 Development Workflow

1. **Pick an issue** or feature from the specifications
2. **Create a branch** from `main`
3. **Implement** following our patterns and conventions
4. **Test** with quality tools (`bun run check`)
5. **Commit** with clear, descriptive messages
6. **Submit a PR** with detailed description

## 📝 Code Conventions

- **TypeScript**: Strict mode enabled
- **Vue**: Composition API with `<script setup>`
- **Styling**: Tailwind CSS with Nuxt UI components
- **Database**: Drizzle ORM with type-safe queries
- **API**: RESTful endpoints under `/api`

## 🧭 Iterative Development

We follow agile principles with clear iterations:

- **Iteration 1**: Basic multi-assistant chat with affiliations (current)
- **Iteration 2**: Observations and dynamic memory (planned)
- **Iteration 3**: Episodes and persistence (planned)

See [specifications](./docs/specification.md) for detailed requirements.

## 🤝 Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Create an issue with reproduction steps
- **Features**: Check specifications first, then discuss

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.
