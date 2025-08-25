# LMiX Specification

> This document describes the current implementation specification. It evolves iteratively as we build.
> See [vision.md](./vision.md) for the complete product vision.

## Iteration 1: MVP - Basic Multi-Assistant Chat

### Goal

Create a working multi-assistant chat where each assistant has limited knowledge about the scenario and other participants.

### User Story

**As a** user  
**I want to** create a conversation between AI assistants with different perspectives and secrets  
**So that** I can explore how asymmetric knowledge affects their interaction

### Core Business Objects

#### Models

LLM configurations (e.g., "gpt-4", "claude-3-sonnet", "llama-2")

#### Affiliations

Group/organization definitions with three layers of truth:

- **Universal**: Known to everyone (public facts)
- **Internal**: Known only to members (shared secrets, including knowledge about other affiliations)
- **External**: How non-members perceive them

#### Personas

Character definitions with three layers of truth:

- **Universal**: Known to everyone (public facts)
- **Internal**: Known only to self (personal secrets, true motivations)
- **External**: How others perceive them
- Can be affiliated with zero or more Affiliations

#### Assistants

The pairing of a Persona with a Model (junction table)

#### Productions

Conversation containers with world and scenario

### Core Features

#### 1.1 Manage Models (CRUD)

**Model Discovery Workflow:**
1. **Provider Configuration**: User enters API endpoint and optional API key
2. **Model Discovery**: Frontend fetches available models directly from provider's API
3. **Model Selection**: User selects which models to add from discovered list
4. **Batch Creation**: Selected models are created in database with provider configuration

**Model Properties:**
- Name (e.g., "GPT-4 Turbo") - auto-generated from model ID
- API Endpoint (e.g., "https://api.openai.com/v1") - normalized base URL
- API Key (optional - nullable for local/Ollama models)
- Model ID (e.g., "gpt-4-turbo-preview") - as returned by provider
- Is Default (only one default model per user)

**Supported Providers:**
- OpenAI and OpenAI-compatible APIs
- Anthropic (static model list)
- Ollama (local models)
- Generic providers with OpenAI-compatible endpoints

**Key Features:**
- Direct browser-to-provider model discovery (no proxy endpoint)
- Bulk model addition in single operation
- Duplicate prevention (checks modelId + apiEndpoint)
- Bidirectional navigation between configuration and selection steps

#### 1.2 Manage Affiliations (CRUD)

**Example Affiliation:**

```
Name: "NYPD Undercover Unit"
Universal Truth: "Elite law enforcement division focused on organized crime"
Internal Truth: "Detective Johnson is Bob Wilson, investigating therapist fraud. Murphy takes bribes from the Italians on Tuesdays."
External Truth: "Tough on crime, by the book, incorruptible"
```

**Another Example:**

```
Name: "Rosetti Crime Family"
Universal Truth: "Local Italian-American business association"
Internal Truth: "Control construction and waste management. Lieutenant Murphy is on our payroll - meets Tuesdays at the docks."
External Truth: "Community leaders, generous donors to local causes"
```

#### 1.3 Manage Personas (CRUD)

**Example Persona:**

```
Name: "Alice Thompson"
Affiliations: []
Universal Truth: "Therapist with 10 years experience, has an office in Manhattan"
Internal Truth: "Struggling with her own anxiety, considering career change"
External Truth: "Caring professional, sometimes asks too many personal questions"
```

**Another Example:**

```
Name: "Bob Wilson / Detective Johnson"
Affiliations: ["NYPD Undercover Unit"]
Universal Truth: "New patient, first therapy session, works in finance"
Internal Truth: "Hates lying to people, considering leaving undercover work"
External Truth: "Nervous, dealing with work stress, closed off emotionally"
```

**Another Example:**

```
Name: "Tony Rosetti"
Affiliations: ["Rosetti Crime Family"]
Universal Truth: "Owns several construction companies"
Internal Truth: "Wants to go legitimate but family won't let him"
External Truth: "Successful businessman, bit rough around the edges"
```

#### 1.4 Manage Assistants (CRUD)

- Select Persona
- Select Model
- Optional: Override model settings for this specific pairing

#### 1.5 Create & Run Productions

**Input:**

- Production name
- Select World (from library or create new)
- Select Scenario (from library or create new)
- Select 2+ assistants
- Show Directive toggle (display system prompts in UI)

**Correct Example:**

```
Name: "Therapy Session"
World: [Select: "Modern NYC" - already defined]
Scenario: [Select: "First Therapy Session" - already defined]
Assistants: [Alice on GPT-4, Bob on Claude]
Show Directive: false
```

**Note:** Bob being undercover is NOT in the scenario - it's in his internal truth!

### Knowledge Distribution

#### What Each Assistant Knows:

```
WORLD: [Shared by all]
SCENARIO: [Shared by all - public information only]

YOU ARE: [Persona Name]
- Universal: [Your universal truth]
- Internal: [Your internal truth - only you know this!]

YOUR AFFILIATIONS:
- [Affiliation Name]:
  - Universal: [Affiliation's universal truth]
  - Internal: [Affiliation's internal truth - shared with all members!]

OTHER PARTICIPANTS:
- [Other Persona Name]
  - Universal: [Their universal truth]
  - External: [Their external truth - how you see them]
  - Affiliations: [List their affiliations]
    - [Affiliation]: Universal + External truth only (unless you're also a member)

KNOWN AFFILIATIONS: [All affiliations mentioned by participants]
- [Affiliation Name]:
  - Universal: [Their universal truth]
  - External: [How non-members see them]
  - Internal: [Only if you're a member!]
```

**Knowledge Layering Example:**
Bob (NYPD member) talking to Tony (Mafia member):

- Bob knows: NYPD's internal secrets, Mafia's public facade
- Tony knows: Mafia's internal secrets (including Murphy corruption), NYPD's public facade
- Neither knows the other's personal secrets

### Technical Implementation

#### API Response Standardization

**Unified Response Format:**
- All API endpoints return a standardized response structure
- Response format: `{ success: boolean, data?: T, message: string, count?: number, meta?: object }`
- Consistent error handling through shared utilities
- DELETE operations return `{ success: true, data: null, message: string }`
- LIST operations include count field automatically

**Error Handling:**
- Centralized error handling through `handleApiError()` utility
- Automatic detection and re-throwing of Nitro errors
- Database constraint violations properly detected and handled
- Consistent error messages across all endpoints

#### Security

**API Key Protection:**
- All API keys are encrypted at rest using industry-standard encryption
- Keys are automatically masked in API responses (showing only first/last few characters)
- Decryption occurs only server-side when making API calls to providers
- No API keys are ever transmitted in plain text to the client
- Database queries return masked keys to prevent accidental exposure

**Row Level Security (RLS):**
- All tables enforce user isolation through PostgreSQL RLS policies
- Users can only access their own models, personas, affiliations, and productions
- Authentication is required for all API endpoints
- User identity is validated through OIDC tokens

**Data Validation:**
- All user inputs are validated both client-side and server-side
- API endpoints enforce strict validation schemas
- SQL injection protection through parameterized queries (Drizzle ORM)
- XSS prevention through proper input sanitization

#### Database Schema (Iteration 1)

```sql
-- LLM configurations
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  api_endpoint TEXT NOT NULL, -- Full API endpoint URL
  api_key TEXT, -- Nullable for local/Ollama models
  model_id TEXT NOT NULL, -- Model identifier for the endpoint
  -- Configuration removed for MVP simplicity
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one default model per user
CREATE UNIQUE INDEX idx_one_default_model_per_user
  ON models (user_id)
  WHERE is_default = true;

-- Group/organization definitions
CREATE TABLE affiliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  universal_truth TEXT, -- Public facts
  internal_truth TEXT,  -- Shared secrets (including knowledge about other affiliations)
  external_truth TEXT,  -- How non-members perceive them
  created_at TIMESTAMP DEFAULT NOW()
);

-- Character definitions
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT, -- Visual representation
  universal_truth TEXT, -- Public facts
  internal_truth TEXT,  -- Personal secrets/private knowledge
  external_truth TEXT,  -- How others perceive them
  created_at TIMESTAMP DEFAULT NOW()
);

-- Persona membership in affiliations
CREATE TABLE persona_affiliations (
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  affiliation_id UUID REFERENCES affiliations(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (persona_id, affiliation_id)
);

-- Junction: Persona + Model = Assistant
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  name TEXT, -- Optional override name
  config_override JSONB, -- Optional model config overrides
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, persona_id, model_id)
);

-- Reusable world settings
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL, -- Immutable laws/setting
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reusable scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL, -- Starting situation (public info only!)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation containers
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  world_id UUID REFERENCES worlds(id) NOT NULL,
  scenario_id UUID REFERENCES scenarios(id) NOT NULL,
  show_directive BOOLEAN DEFAULT false, -- Show system prompts in UI
  created_at TIMESTAMP DEFAULT NOW()
);

-- Which assistants are in which production
CREATE TABLE production_assistants (
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
  PRIMARY KEY (production_id, assistant_id)
);

-- Conversation messages
CREATE TABLE turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id),
  parent_turn_id UUID REFERENCES turns(id), -- For branching conversations
  content TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints

```typescript
// Models CRUD (✅ Implemented with standardized responses)
GET    /api/models               // Returns: ApiResponse<Model[]>
POST   /api/models               // Accepts: Model | Model[], Returns: ApiResponse<Model | Model[]>
PUT    /api/models/:id           // Returns: ApiResponse<Model>
DELETE /api/models/:id           // Returns: ApiResponse<null>
POST   /api/models/test          // Test model connection

// Worlds CRUD
GET    /api/worlds
POST   /api/worlds
PUT    /api/worlds/:id
DELETE /api/worlds/:id

// Scenarios CRUD
GET    /api/scenarios
POST   /api/scenarios
PUT    /api/scenarios/:id
DELETE /api/scenarios/:id

// Affiliations CRUD
GET    /api/affiliations
POST   /api/affiliations
PUT    /api/affiliations/:id
DELETE /api/affiliations/:id

// Personas CRUD (✅ Implemented with standardized responses)
GET    /api/personas             // Returns: ApiResponse<Persona[]>
POST   /api/personas             // Returns: ApiResponse<Persona>
PUT    /api/personas/:id         // Returns: ApiResponse<Persona>
DELETE /api/personas/:id         // Returns: ApiResponse<null>

// Assistants CRUD (✅ Implemented with standardized responses)
GET    /api/assistants           // Returns: ApiResponse<Assistant[]> with joined persona/model data
POST   /api/assistants           // Returns: ApiResponse<Assistant>
PUT    /api/assistants/:id       // Returns: ApiResponse<Assistant>
DELETE /api/assistants/:id       // Returns: ApiResponse<null>

// Productions
GET    /api/productions          // List all
POST   /api/productions          // Create new
GET    /api/productions/:id      // Get with assistants and turns
DELETE /api/productions/:id      // Delete

// Generate turn
POST   /api/productions/:id/turns
```

#### Pages & Components

```
/                        # Welcome/dashboard
/models                  # ✅ Models management with Insert/Update/Delete components
/models/create           # ✅ Two-step model discovery and creation
/models/[id]             # ✅ Model details and configuration
/worlds                  # Worlds management (table + create/edit modal)
/scenarios               # Scenarios management (table + create/edit modal)
/affiliations            # Affiliations management (table + create/edit modal)
/personas                # ✅ Personas management with Upsert/Delete components
/personas/create         # ✅ Create new persona
/personas/[id]           # ✅ Persona details and editing
/assistants              # ✅ Assistants management with Upsert/Delete components
/assistants/create       # ✅ Create new assistant
/assistants/[id]         # ✅ Assistant details and editing
/productions             # Productions list (table + create modal)
/productions/[id]        # Chat interface

Implemented Components:
- models/Insert.vue      # ✅ Two-step model discovery and batch creation
- models/Update.vue      # ✅ Model configuration editor
- models/Delete.vue      # ✅ Deletion confirmation modal
- models/CreateModal.vue # ✅ Modal wrapper for Insert
- personas/Upsert.vue    # ✅ Unified create/edit form
- personas/Delete.vue    # ✅ Deletion confirmation modal
- personas/CreateModal.vue # ✅ Modal wrapper for Upsert
- assistants/Upsert.vue  # ✅ Unified create/edit form
- assistants/Delete.vue  # ✅ Deletion confirmation modal
- CreateButton.vue       # ✅ Reusable create button component

Shared Utilities:
- server/utils/responses.ts # ✅ Standardized API responses
- app/types/components.ts   # ✅ Standardized component interfaces

Planned Components:
- WorldForm.vue          # Create/edit form in modal
- ScenarioForm.vue       # Create/edit form in modal
- AffiliationForm.vue    # Create/edit form in modal
- ProductionForm.vue     # Create form in modal (with world/scenario selectors)
- ChatInterface.vue      # Main chat UI using Nuxt UI components
```

### Success Criteria

- [x] User can create models, affiliations (partial), personas, and assistants
- [ ] Personas can be affiliated with multiple organizations (schema ready, UI pending)
- [ ] User can create a production with 2+ assistants
- [ ] Each assistant knows their own persona + affiliation truths
- [ ] Each assistant only sees universal/external truths of others
- [ ] Affiliated assistants share affiliation's internal knowledge
- [ ] Conversation feels believably asymmetric with rich knowledge layers
- [x] Works with OpenAI API (configurable)
- [x] Model discovery from OpenAI-compatible endpoints
- [x] Bulk model creation from discovered models
- [x] API key encryption and masking
- [x] Standardized API responses across all endpoints
- [x] Consistent error handling patterns

### Out of Scope for Iteration 1

- Entity/relation extraction
- Observations and memory
- Episodes/series
- Memory decay/reinforcement
- Multiple productions
- Branching conversations
- Director controls

---

## Technical Debt & Architecture Improvements (Future Consideration)

### User Experience Enhancements

#### Optimistic Updates
**Priority: Medium**
- Update local state immediately on user actions (create/update/delete)
- Show loading states while API call is in progress
- Rollback changes if API call fails
- Benefits: Perceived performance improvement, more responsive UI

#### Request Deduplication
**Priority: Medium**
- Prevent duplicate API requests when multiple components trigger the same fetch
- Implement request caching with TTL (time-to-live)
- Use libraries like TanStack Query or SWR for automatic deduplication
- Benefits: Reduced server load, faster responses for cached data

#### Global Loading States
**Priority: Low**
- Implement a global loading indicator for long-running operations
- Show progress indicators for batch operations (e.g., creating multiple models)
- Benefits: Better user feedback during operations

### Code Quality & Maintainability

#### Shared CRUD Patterns
**Priority: High**
- Extract common CRUD logic into composables: `useCrudStore<T>(endpoint: string)`
- Create generic CRUD components that work with any entity type
- Standardize validation patterns across all forms
- Benefits: Reduced code duplication, consistent behavior, easier testing

#### Advanced Error Handling
**Priority: Medium**
- Implement global error boundaries for unhandled exceptions
- Add retry logic for network failures
- Create user-friendly error messages with suggested actions
- Add error reporting/logging for debugging
- Benefits: Better error recovery, improved debugging, better UX

#### Type Safety Improvements
**Priority: Medium**
- Replace `error instanceof Error` checks with proper error types
- Create discriminated union types for API responses
- Add runtime validation for API responses
- Benefits: Better TypeScript support, catch errors at compile time

#### Performance Optimizations
**Priority: Low**
- Implement virtual scrolling for large lists
- Add pagination for large datasets
- Lazy load components and routes
- Optimize bundle sizes with tree shaking
- Benefits: Better performance with large datasets, faster initial load

### Data Management

#### Advanced Caching Strategy
**Priority: Low**
- Implement service worker for offline support
- Add background sync for offline actions
- Cache frequently accessed data in IndexedDB
- Benefits: Offline functionality, better performance

#### Real-time Updates
**Priority: Low (for current scope)**
- WebSocket support for real-time collaboration
- Server-sent events for live notifications
- Conflict resolution for concurrent edits
- Benefits: Multi-user collaboration, live updates

### Testing & Quality Assurance

#### Comprehensive Testing
**Priority: High**
- Unit tests for all composables and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Component testing with Vue Test Utils
- Benefits: Reduced bugs, easier refactoring, better reliability

#### Development Tools
**Priority: Medium**
- Add development-only debugging tools
- API request/response logging in dev mode
- State inspection tools for Pinia stores
- Benefits: Easier debugging, better developer experience

### Security Enhancements

#### Input Sanitization
**Priority: High**
- Server-side HTML sanitization for all text inputs
- Client-side XSS prevention
- SQL injection prevention (already handled by Drizzle ORM)
- Benefits: Enhanced security posture

#### Rate Limiting
**Priority: Medium**
- Implement rate limiting for API endpoints
- Add CAPTCHA for sensitive operations
- Session timeout handling
- Benefits: Protection against abuse, better security

### Implementation Recommendations

1. **Start with high-priority items** that have the biggest impact on code maintainability
2. **Implement shared CRUD patterns** first as they'll make future development faster
3. **Add comprehensive testing** before making major architectural changes
4. **Consider optimistic updates** when implementing the chat interface (Iteration 1)
5. **Evaluate TanStack Query** or similar for request management when adding real-time features

---

## Iteration 2: Observations & Memory (Planned)

### Goal

Add dynamic knowledge accumulation through observations extracted from conversations.

### Features

- Automatic observation extraction from turns
- Knowledge filtering based on what each assistant would observe
- Observations affect future responses

### Technical Additions

- Add observations table
- Implement extraction service
- Update context builder to include relevant observations

_Details to be specified after Iteration 1 is complete_

---

## Iteration 3: Episodes & Persistence (Planned)

### Goal

Enable episodic storytelling where characters evolve across multiple episodes.

### Features

- Series container for episodes
- Observation persistence across episodes
- Smart memory filtering for context windows

_Details to be specified after Iteration 2 is complete_

---

## Implementation Status

### ✅ Completed

- Product vision documented
- Core concept defined
- Database schema implemented (all tables)
- Authentication system (OIDC with row-level security)
- Models CRUD with discovery workflow
- Personas CRUD with three layers of truth
- Assistants CRUD (persona + model pairing)
- API response standardization
- Consistent error handling
- Component architecture patterns
- Pinia stores for state management
- i18n support throughout

### 🚧 In Progress

- Affiliations CRUD UI
- Worlds CRUD
- Scenarios CRUD
- Productions management
- Chat interface

### 📋 Planned

- Complete Iteration 1 implementation
- Iteration 2 specification (Observations & Memory)
- Iteration 3 specification (Episodes & Persistence)

---

## Notes

This specification follows agile principles:

1. **Working software over comprehensive documentation** - We specify just enough to build
2. **Responding to change over following a plan** - Specifications evolve based on learnings
3. **Customer collaboration over contract negotiation** - User feedback drives iterations
4. **Individuals and interactions over processes and tools** - Keep it simple, focus on value
