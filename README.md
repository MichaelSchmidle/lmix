# LMiX 🎭

> Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.

## Overview 🌟

LMiX is not just another AI chat interface - it's a platform for orchestrating rich interactions between multiple AI assistants, each with their own role, perspective, and knowledge state. Think of it as a theater where you're the director, but your actors can evolve beyond their initial roles and even break the fourth wall.

## Core Concepts 🎯

### Worlds
Define the stage for your interactions:
- Settings and rules
- Physical laws
- Universal truths
- Environmental conditions

### Personas
Create assistants with:
- Self-perception (how they view themselves)
- Optional public perception (how others view them)
- Hidden capabilities and knowledge
- Ability to evolve through interactions

### Scenarios
Bring it all together with natural language descriptions of:
- Current situation
- Relationships and tensions
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

## Contributing 🤝

Whether you're a developer, writer, or just someone with amazing ideas, we'd love your help in pushing the boundaries of what's possible with AI interactions.

## License

LMiX is licensed under the [MIT License](/LICENSE).

---

*LMiX: Where every conversation is a new story waiting to unfold.*