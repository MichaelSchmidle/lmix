# LMiX

Multi-assistant chat platform with imperfect knowledge distribution.

Create conversations between AI assistants where each has their own perspective, secrets, and limited knowledge about the world and other participants. Unlike traditional multi-agent systems, LMiX creates realistic scenarios where misunderstandings and asymmetric information drive compelling interactions.

## ✨ Key Features

- **🎭 Asymmetric Knowledge**: Each assistant has unique, limited perspective
- **📝 Natural Language Setup**: Define complex scenarios in plain English
- **📺 Episodic Storytelling**: Characters evolve across multiple episodes

## 🚀 Quick Start

> **Note**: Production deployment guide coming soon. Currently supports development only.

### Development Setup

**Prerequisites**: Docker, Node.js 18+, [mkcert](https://mkcert.dev/)

```bash
# Clone and setup
git clone https://github.com/MichaelSchmidle/lmix.git
cd lmix
cp .env.example .env

# Start infrastructure
bun install
bun run infra:start

# Run development server
bun run dev
```

Visit `https://app.localhost` to get started.

## 📚 Learn More

- **[Product Vision](./docs/vision.md)** - Complete conceptual framework and innovations
- **[Specifications](./docs/specification.md)** - Implementation details and roadmap
- **[Contributing](./CONTRIBUTING.md)** - Development setup and guidelines

## 🗂️ Use Cases

- **Interactive Storytelling**: Characters with secrets and evolving relationships
- **Training Simulations**: Realistic scenarios with incomplete information
- **Creative Writing**: Explore narrative possibilities through character interactions
- **Educational Tools**: Demonstrate perspective-taking and empathy

## 🛡️ Self-Hosted & Private

LMiX is designed for self-hosting with privacy in mind:

- All conversations stay on your infrastructure
- Works with local LLM models (Ollama) or cloud APIs
- No telemetry or external data sharing

## 📄 License

[License information to be added]
