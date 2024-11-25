# LMiX Technical Documentation

## Architecture Overview

### Core Architecture

LMiX is a local-first web application built with:
- Nuxt as the application framework
- Supabase as the backend
- TypeScript as the programming language

### Technical Stack

Core libraries:
- NuxtUI (includes Tailwind ecosystem)
- FormKit and FormKit Pro with addons
- Tailwind Merge
- Vue I18n
- Vercel's AI SDK
- Pinia
- Drizzle ORM

Helper libraries are added based on specific needs.

### Domain Model

LMiX uses minimal data structures, leveraging natural language descriptions where possible. Example:

```ts
type World = {
  uuid: string
  name: string
  description: string
}
```

#### Core Business Objects

- Production: Main container that brings everything together
- World: Global and immutable conditions governing a production
- Scenario: Starting context of a production that can dynamically evolve
- Model: API connection details
- ModelGroup: Models available at the same API endpoint
- Persona: Different perception, knowledge, and avatar attributes
- Assistant: Links personas with models
- Turn: Content of a production and wrapper around OpenAI-compatible message structure with extended content

#### Domain Model Relationships

```ts
type Production = {
  uuid: string
  name: string
  scenario: Scenario
  world: World
  assistants: Assistant[]
  personas: Persona[]     // User personas
  turns: Turn[]
}

type ModelGroup = {
  [apiEndpoint: string]: {
    apiKey?: string
    models: Model[]
  }
}

type Assistant = {
  uuid: string
  name: string
  model: Model
  persona: Persona
}
```

### Security Model

- OAuth-only authentication through Supabase
- Row Level Security (RLS) policies
- User UUID association for all data rows

### Error Handling Strategy

#### Error Types

```ts
// Base error type for all LMiX errors
class LMiXError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'LMiXError'
  }
}

// Specific error types
class ValidationError extends LMiXError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

class AuthenticationError extends LMiXError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', details)
    this.name = 'AuthenticationError'
  }
}

class ApiError extends LMiXError {
  constructor(message: string, details?: unknown) {
    super(message, 'API_ERROR', details)
    this.name = 'ApiError'
  }
}
```

#### Error Handling Layers

1. **API Routes** (`server/api/`):
  - Handle external service errors
  - Convert to LMiXError types
  - Return structured error responses:

    ```ts
    interface ApiErrorResponse {
     code: string      // Internal error code
     message: string   // i18n key
     details?: unknown // Debug info (dev only)
    }
    ```

2. **Pinia Stores**:
  - Handle optimistic updates
  - Catch API errors and rollback state if needed
  - Re-throw errors for UI handling:

  ```ts
  export const useProductionStore = defineStore('production', {
   actions: {
     async createProduction(data: ProductionCreate) {
       // Optimistic update
       const tempId = crypto.randomUUID()
       this.productions.push({ ...data, id: tempId })
       
       try {
         const result = await $fetch('/api/productions', {
           method: 'POST',
           body: data,
         })

         // Update with real data
         const idx = this.productions.findIndex(p => p.id === tempId)
         this.productions[idx] = result
       }
       catch (error) {
         // Rollback on failure
         this.productions = this.productions
           .filter(p => p.id !== tempId)
         
         throw error // Re-throw for UI handling
       }
     }
   }
  })
  ```

3. **Components/Pages**:
  - Handle user interaction errors
  - Display error messages using i18n
  - Log errors in development:

    ```vue
    <script setup lang="ts">
    const store = useProductionStore()
    const { g: t } = useI18n({'useScope: global'})

    async function handleSubmit() {
     try {
       await store.createProduction(formData)
     }
     catch (error) {
       if (error instanceof ValidationError) {
         showError(g(error.message))
       }
       else {
         showError(g('errors.unexpected'))
         if (process.dev) {
           console.error(error)
         }
       }
     }
    }
    </script>
    ```

4. **Global Error Handler**:
  - Catch unhandled errors
  - Log errors in development
  - Show generic error message in production

    ```ts
    // plugins/error-handler.ts
    export default defineNuxtPlugin((nuxtApp) => {
     nuxtApp.vueApp.config.errorHandler = (error) => {
       if (process.dev) {
         console.error(error)
       }

       // Show generic error toast/notification
       showError('errors.unexpected')
     }
    })
    ```

## Development Standards

### TypeScript Conventions

#### Interface Definitions

```ts
// No trailing commas in interface definitions
interface Production {
  uuid: string
  name: string
  scenario: Scenario
  world: World
  assistants: Assistant[]
  personas: Persona[]
  messages: Message[]
}
```

#### Array/Object Literals

```ts
// Use trailing commas in array and object literals
const config = {
  name: 'LMiX',
  version: '1.0.0',
  features: ['chat', 'scenarios'],
}

const items = [
  'first',
  'second',
  'third',
]
```

### Pinia Conventions

#### Setup Stores

```ts
// stores/production.ts
export const useProductionStore = defineStore('production', () => {
  // State
  const productions = ref<Production[]>([])
  
  // Getters
  const getProduction = computed(() => {
    return (id: string) => productions.value.find(p => p.uuid === id)
  })
  
  // Actions
  async function createProduction(data: ProductionCreate) {
    // Optimistic update
    const tempId = crypto.randomUUID()
    productions.value.push({ ...data, id: tempId })
    
    try {
      const result = await $fetch('/api/productions', {
        method: 'POST',
        body: data,
      })

      // Update with real data
      const idx = productions.value.findIndex(p => p.uuid === tempId)
      productions.value[idx] = result
    } 
    catch (error) {
      // Rollback on failure
      productions.value = productions.value
        .filter(p => p.uuid !== tempId)
      throw error // Re-throw for UI handling
    }
  }

  return {
    // State
    productions,
    // Getters
    getProduction,
    // Actions
    createProduction,
  }
})
```

#### Store Organization

- One store per major feature/domain object
- Keep related state together
- Export store with 'use' prefix
- Use autocompletion helper:

```ts
// stores/index.ts
export * from './production'
export * from './assistant'
// etc.

// types/stores.d.ts
import { useProductionStore } from '@/stores/production'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    stores: {
      production: ReturnType<typeof useProductionStore>
      // Add other stores
    }
  }
}
```

#### Store Usage in Components

```vue
<script setup lang="ts">
const store = useProductionStore()
const { productions } = storeToRefs(store)

async function handleCreate() {
  try {
    await store.createProduction(formData)
  }
  catch (error) {
    if (error instanceof ValidationError) {
      showError(t(error.message))
    }
    else {
      showError(t('errors.unexpected'))
      if (process.dev) {
        console.error(error)
      }
    }
  }
}
</script>
```

### Code Documentation Practices

#### Store Documentation

Pinia stores are documented using TypeScript JSDoc comments following these principles:

1. **Store Overview**: Each store file starts with a brief JSDoc comment describing its purpose:
```ts
/**
 * Store for managing [resource] in the application.
 * Handles CRUD operations and state management for [resource].
 */
```

2. **State Properties**: Document state properties with their types and purposes:
```ts
/**
 * @property items - List of items in the store
 * @property loading - Whether the store is currently loading data
 * @property error - Error that occurred during the last operation
 */
```

3. **Getters and Actions**: Each getter and action must be documented with:
   - Description of what the function does
   - Parameters and their types
   - Return value and type
   - Exceptions that may be thrown
   - Example usage if not obvious

Example of a getter:
```ts
/**
 * Finds an item by its UUID.
 * 
 * @param uuid - The UUID of the item to find
 * @returns The item if found, undefined otherwise
 * @example
 * const item = getItem('123e4567-e89b-12d3-a456-426614174000')
 */
const getItem = computed(() => {
  return (uuid: string) => items.value.find(i => i.uuid === uuid)
})
```

Example of an action:
```ts
/**
 * Creates or updates an item in the store and database.
 * 
 * @param item - The item data to upsert
 * @throws {ValidationError} If the item data is invalid
 * @throws {DatabaseError} If the database operation fails
 * @returns The UUID of the created/updated item
 * 
 * @remarks
 * - Creates a new item if UUID is not provided
 * - Updates existing item if UUID matches
 * - Performs optimistic update in the store
 */
async function upsertItem(item: ItemInsert): Promise<string> {
  // Implementation
}
```

4. **Type Annotations**: 
   - Define interfaces and types in dedicated type files
   - Use descriptive names that reflect the business domain
   - Document complex types with JSDoc comments

This approach ensures:
- Clear documentation of parameter requirements and return values
- Proper error handling through documented exceptions
- IDE support for autocomplete and type checking
- Self-documenting code through TypeScript's type system

### Testing Strategy

#### Unit Tests

- Framework: Vitest
- Coverage: All business logic and utility functions
- Location: tests/unit/*
- Run: npm run test:unit

#### End-to-End Tests

- Framework: Playwright
- Coverage: Critical user flows
- Location: tests/e2e/*
- Run: npm run test:e2e

#### Test Guidelines

- Tests should be deterministic
- Use meaningful test data
- Mock external services
- Follow AAA pattern (Arrange, Act, Assert)

#### Test File Organization

````
src/
  utils/
    format.ts
tests/
  unit/
    utils/
      format.spec.ts  # Matches source file structure
  e2e/
    productions.spec.ts  # Tests full user flows
```

### Performance

- Optimistic UI updates for improved perceived performance
- Main bottleneck (LLM inference) is outside application scope
- No monitoring needed as this is a local-first application

## Design System

### Colors
- white
- black
- neutral
- rose (error)
- orange (warning)
- lime (success)
- cyan (form)
- indigo (primary)

### Typography
- Sans: DM Sans
- Serif: DM Serif Display
- Mono: JetBrains Mono

### Icons
- UI: Phosphor Icons
- Brands: Simple Icons