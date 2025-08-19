# LMiX Architecture

## Overview

LMiX (LLM Mix) is a multi-assistant chat platform that enables dynamic conversations between AI assistants with **imperfect knowledge distribution**. Unlike traditional multi-agent systems where all agents share the same knowledge, LMiX creates realistic scenarios where each assistant has their own perspective, beliefs, and limited knowledge about the world and other participants.

## Core Concept: Natural Language meets Entity-Relation-Observation

LMiX combines the ease of natural language setup with the power of structured knowledge tracking through a hybrid approach:

### Input Layer: Natural Language
Users define productions using simple, natural language descriptions:
- **World**: Immutable, objective laws (e.g., "Victorian London with magic")
- **Scenario**: Dynamic starting situation (e.g., "Detective suspects the Baron")
- **Personas**: Three-layer truth model (universal/internal/external perspectives)

### Runtime Layer: Entity-Relation-Observation (ERO)
The system dynamically builds a knowledge graph as the conversation progresses:
- **Entities**: Any participant, object, or concept that exists
- **Relations**: Connections between entities (knows, trusts, owns, fears)
- **Observations**: What each entity observes about others and their relations

### Output Layer: Asymmetric Knowledge
Knowledge distribution emerges naturally from observations:
- Each assistant only knows what they've observed
- Contradictory beliefs can coexist
- Knowledge gaps create realistic interactions

## How It Works

```
1. Setup Phase (Natural Language)
   └─> User writes world, scenario, and personas in plain text
   
2. Extraction Phase (Automatic)
   └─> System lazily extracts entities and relations as needed
   
3. Conversation Phase (Dynamic)
   └─> Each turn generates new observations
   └─> Knowledge graphs diverge per assistant
   
4. Response Generation (Constrained)
   └─> Assistants only access their observed knowledge
   └─> Responses reflect their limited perspective
```

## Example Flow

**Setup:**
> World: Modern NYC  
> Scenario: Alice the therapist is treating Bob, who is secretly an undercover cop

**System Extracts:**
- Entities: `Alice (therapist)`, `Bob (patient/cop)`
- Relations: `treats(Alice→Bob)`, `pretends(Bob→patient)`
- Initial Observations:
  - Alice observes: `Bob is a patient`
  - Bob observes: `Alice doesn't know I'm a cop`

**During Conversation:**
- Bob mentions "stressful work situations"
- Alice observes: `Bob has a stressful job`
- Bob observes: `Alice is probing about my work`

**Knowledge Asymmetry:**
- Alice's knowledge: Patient with stress, needs help
- Bob's knowledge: Maintaining cover, gathering intel

## Episodic Productions

LMiX supports episodic storytelling where characters evolve across multiple episodes, carrying their experiences and learned knowledge forward:

### Series Structure
- **Series**: Container for related episodes (e.g., "Star Trek: Deep Space Nine")
- **Episodes**: Individual productions within a series
- **Persistent Knowledge**: Observations carry over between episodes
- **Character Development**: Relationships and trust evolve naturally

### Example
**Episode 1**: "Commander arrives at the station"
- Sisko observes: "Kira distrusts Starfleet"
- Kira observes: "Sisko lost his wife at Wolf 359"

**Episode 2**: "Cardassian war criminal arrives"
- Both start with their Episode 1 observations
- Sisko knows to respect Kira's Bajoran pride
- Kira may trust Sisko more after he proved himself

## Memory Management

### Smart Context Filtering
Not all observations are relevant to every conversation. LMiX intelligently filters memories based on:

1. **Entity Presence**: Only include observations about entities in the current episode
2. **Core Memories**: Major events flagged for long-term retention
3. **Recency**: Recent observations weighted higher
4. **Relevance Scoring**: Context-aware importance calculation

### Memory Dynamics
- **Reinforcement**: Frequently accessed memories strengthen
- **Decay**: Unused observations gradually fade (except core memories)
- **Forgetting**: Realistic memory limitations (configurable per character)
- **Summarization**: Old observations compress into general impressions

### Context Window Optimization
For limited context windows (especially self-hosted models):

```sql
-- Smart observation fetching
SELECT * FROM observations
WHERE observer_entity_id = ?
  AND (
    -- Entities in current episode
    about_entity_id IN (current_episode_entities)
    -- Core memories always included
    OR is_core_memory = true
    -- Recent observations
    OR observed_at > recency_threshold
  )
ORDER BY relevance_score DESC
LIMIT context_budget
```

## Data Model

### Core Tables

```sql
-- Series container for episodic productions
series (
  id UUID PRIMARY KEY,
  name TEXT,
  world TEXT, -- Shared world across episodes
  metadata JSONB
)

-- Flexible entities that can represent anything
entities (
  id UUID PRIMARY KEY,
  type TEXT, -- 'assistant', 'character', 'object', 'concept'
  name TEXT,
  metadata JSONB -- Includes persona layers, memory traits
)

-- Relationships between entities
relations (
  id UUID PRIMARY KEY,
  from_entity_id UUID REFERENCES entities,
  to_entity_id UUID REFERENCES entities,
  type TEXT, -- 'knows', 'trusts', 'owns', 'fears', etc.
  strength DECIMAL, -- Relationship strength (can change over time)
  metadata JSONB
)

-- What each entity observes (the key to imperfect knowledge)
observations (
  id UUID PRIMARY KEY,
  series_id UUID REFERENCES series, -- Links to series for persistence
  production_id UUID REFERENCES productions, -- Episode where observed
  observer_entity_id UUID REFERENCES entities,
  about_entity_id UUID REFERENCES entities, -- nullable
  about_relation_id UUID REFERENCES relations, -- nullable
  content TEXT, -- The observation itself
  confidence DECIMAL, -- How certain the observer is
  relevance_score DECIMAL, -- Calculated importance
  is_core_memory BOOLEAN DEFAULT false, -- Never forgotten
  reinforcement_count INTEGER DEFAULT 0, -- Times accessed
  last_accessed TIMESTAMP,
  observed_at TIMESTAMP,
  metadata JSONB
)

-- Episodes within a series
productions (
  id UUID PRIMARY KEY,
  series_id UUID REFERENCES series, -- nullable for standalone
  episode_number INTEGER,
  name TEXT,
  scenario TEXT, -- Episode-specific starting scenario
  created_at TIMESTAMP
)

-- Individual messages in conversations
turns (
  id UUID PRIMARY KEY,
  production_id UUID REFERENCES productions,
  assistant_entity_id UUID REFERENCES entities,
  content TEXT,
  created_at TIMESTAMP,
  metadata JSONB -- Stores extracted observations
)

-- Tracks which entities participate in which episodes
episode_participants (
  production_id UUID REFERENCES productions,
  entity_id UUID REFERENCES entities,
  PRIMARY KEY (production_id, entity_id)
)
```

### Persona Layers (Maintained for Compatibility)

The three-layer truth model is preserved as metadata on assistant entities:
1. **Universal Truth**: What is objectively true
2. **Internal Perspective**: What the assistant believes about themselves
3. **External Perception**: How others see them

## Key Design Decisions

### Why Not Embeddings/Vectors?

The initial implementation uses pure relational data because:
- **Simplicity**: SQL queries are sufficient for knowledge retrieval
- **Debuggability**: Can directly inspect what each assistant knows
- **Performance**: No vector search overhead
- **LLM Handles Semantics**: The language model already understands context

Future enhancements could add embeddings for:
- Scenario similarity search
- Contradiction detection
- Semantic relation matching

### Lazy Extraction

Entities and relations are extracted on-demand rather than upfront:
- Reduces setup friction
- Allows natural language to remain primary interface
- Extracts only what's needed for the conversation
- Can progressively build complex knowledge graphs

### Production-Centric Design

Each production is self-contained:
- Isolated knowledge graphs per production
- No knowledge bleeding between scenarios
- Easy to branch and explore alternatives
- Simple to persist and resume

## Technical Stack

- **Framework**: Nuxt 3 with TypeScript
- **UI**: Nuxt UI v3 Pro (includes chat components)
- **Database**: PostgreSQL with Row-Level Security
- **Auth**: Zitadel (via NuxtShip)
- **State**: Pinia stores
- **ORM**: Drizzle

## Security Model

- User authentication via Zitadel OIDC
- Row-Level Security (RLS) ensures data isolation
- Each user's productions are private
- PostgreSQL session variables for auth context

## Prompt Context Construction

When an assistant generates a response, their context is carefully constructed to maintain imperfect knowledge while staying within context limits:

### Context Components (in order)
1. **World Definition** (immutable, shared)
   - Physical laws, setting, universal truths
   
2. **Current Scenario** (episode-specific)
   - What's happening in this episode
   
3. **Persona Information**
   - Own persona: Universal + Internal truths
   - Other personas: Universal + External truths only
   - Never see others' internal truths
   
4. **Filtered Observations** (smart selection)
   - Core memories (always)
   - Observations about present entities
   - Recent high-relevance observations
   - Sorted by relevance score
   
5. **Current Episode History**
   - All messages in current conversation
   - May include inline observations from this episode

### Example Context for Assistant A in Episode 2

```
WORLD: 24th century space station near stable wormhole

SCENARIO: A Cardassian war criminal arrives seeking medical treatment

YOUR CHARACTER: Commander Sisko
- Universal: Starfleet commander, widower, father
- Internal: Still grieving Jennifer, determined to protect Bajor

OTHER CHARACTERS:
- Major Kira
  - Universal: Bajoran militia, former resistance fighter
  - External: Distrusts outsiders, fiercely protective of Bajor

YOUR MEMORIES:
- [Episode 1, High Confidence] Kira initially resisted my command
- [Episode 1, Core Memory] Kira respects strength and directness
- [Episode 1, Medium Confidence] Kira has contacts in the former resistance

CONVERSATION:
[Current episode's message history]
```

## Innovative Features

### 1. Natural Language to Knowledge Graph
- Users write in plain English
- System extracts structured knowledge automatically
- No manual ontology creation required

### 2. Episodic Memory with Persistence
- Characters evolve across episodes
- Relationships strengthen or weaken naturally
- True character arcs emerge from experience

### 3. Realistic Memory Management
- Core memories (trauma, major events) never fade
- Routine observations decay without reinforcement
- Character-specific memory traits (eidetic, forgetful)

### 4. Context-Aware Filtering
- Only relevant memories loaded per conversation
- Automatic relevance scoring
- Graceful degradation for limited context windows

### 5. Asymmetric Knowledge by Design
- Each assistant has unique perspective
- Contradictory beliefs coexist naturally
- Misunderstandings create realistic drama

## Future Enhancements

1. **Knowledge Inference**: Derive implicit knowledge from observations
2. **Contradiction Detection**: Flag conflicting observations
3. **Knowledge Sharing**: Assistants can share observations through dialogue
4. **Meta-Observations**: Observing other assistants' reactions and behaviors
5. **Emotional Modeling**: Observations affect emotional states
6. **Trust Networks**: Dynamic trust relationships affect information sharing
7. **Memory Consolidation**: Sleep/downtime periods that reorganize memories
8. **Narrative Coherence**: Ensure story consistency across episodes