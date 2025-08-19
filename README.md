# LMiX

Built with NuxtShip - Authentication and infrastructure included.

Get enterprise-grade authentication, user management, and database security out of the box. No more coding login flows, password resets, or user profiles. Focus on the unique business logic of your app while standing on the shoulders of giants.

## ✨ What You Get with NuxtShip

- **🔐 Complete Authentication**: Login, logout, password reset, user profiles
- **👤 User Management**: Add, remove, edit users for your app
- **🛡️ Row Level Security**: User-scoped data isolation at the database level
- **🌐 SSL for Development**: Automatic certificates, no browser warnings
- **🐳 Container-First**: Consistent development environment
- **⚡ Zero Config**: From idea to running app in 3 commands

## 📋 Prerequisites

- **[Node.js](https://nodejs.org/)** (18.0.0+)
- **[Docker](https://www.docker.com/)**
- **[Bun](https://bun.sh/)** (or npm/pnpm/yarn)
- **[mkcert](https://mkcert.dev/)**

## 🛠️ Development

```bash
bun run dev          # Local Nuxt development with containerized infrastructure
```

This approach gives you the best of both worlds:

- **Fast development** - Native Node.js performance, instant hot reload
- **Consistent infrastructure** - Database, authentication, and proxy services run in containers
- **No "works on my machine"** - Infrastructure is identical across all environments

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

## 🗂️ Project Structure

```
lmix/
├── app/                    # Your Nuxt application
├── deployment/             # Infrastructure configuration
│   ├── docker-compose.yml      # Base services
│   ├── docker-compose.dev.yml  # Development overrides
│   └── scripts/                # Setup automation
├── server/                 # API and database
└── .env                    # Configuration (see .env.example)
```

### Authentication Flow

1. User visits your app
2. Redirected to Zitadel for secure authentication
3. PKCE flow ensures token security
4. User returns with valid session

## 🔍 Available Services

After setup:

- **`https://app.localhost`**: Your application
- **`https://auth.localhost`**: Authentication provider
- **`https://proxy.localhost:8080`**: Traefik dashboard (dev)

## 🧪 Quality Tools

```bash
bun run typecheck    # Type checking
bun run lint         # Code linting
bun run lint:fix     # Auto-fix issues
bun run check        # Run all checks

---

Built with NuxtShip and powered by [Node.js](https://nodejs.org/), [Docker](https://www.docker.com/), [Bun](https://bun.sh/), [mkcert](https://mkcert.dev/), [Nuxt](https://nuxt.com/), [Traefik](https://traefik.io/), [Zitadel](https://zitadel.com/), [PostgreSQL](https://postgresql.org/), [Drizzle](https://orm.drizzle.team/), [Nuxt UI](https://ui.nuxt.com/), [nuxt-oidc-auth](https://nuxtoidc.cloud), and [Phosphor Icons](https://phosphoricons.com/).
```
