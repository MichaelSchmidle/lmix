import { useProductionStore } from '@/stores/production'
import { useModelStore } from '@/stores/models'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    stores: {
      production: ReturnType<typeof useProductionStore>
      model: ReturnType<typeof useModelStore>
      // Add other stores
    }
  }
} 