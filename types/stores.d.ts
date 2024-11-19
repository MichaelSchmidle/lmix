import type { StoreDefinition } from 'pinia'
import type { World, Scenario, Production, Model, Assistant, Persona, Relation } from './app'

export interface BaseState<T> {
  items: T[]
  loading: boolean
  error: LMiXError | null
}

export interface BaseGetters<T> {
  navigation: ComputedRef<VerticalNavigationLink[]>
  options: ComputedRef<{ label: string; value: string }[]>
  getItem: (uuid: string) => T | undefined
}

export interface BaseActions {
  select(): Promise<void>
}

export type StoreNames = 'world' | 'scenario' | 'production' | 'model' | 'assistant' | 'persona' | 'relation'

export type StoreTypes = {
  world: World
  scenario: Scenario
  production: Production
  model: Model
  assistant: Assistant
  persona: Persona
  relation: Relation
}

declare module 'pinia' {
  export interface PiniaCustomProperties {
    stores: {
      [K in StoreNames]: ReturnType<typeof import(`@/stores/${K}`)[`use${Capitalize<K>}Store`]>
    }
  }
} 