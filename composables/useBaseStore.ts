import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'
import type { UnwrapRef, Ref } from 'vue'

export interface BaseEntity {
  uuid: string
  name: string
  created_at: string
  user_uuid: string
}

export interface BaseStoreOptions<T extends BaseEntity> {
  name: string
  tableName: keyof Database['public']['Tables']
  navigationPathPrefix: string
  selectQuery?: string
  sortItems?: (a: T, b: T) => number
  transformResponse?: (data: any[]) => T[]
}

export function useBaseStore<T extends BaseEntity>(options: BaseStoreOptions<T>) {
  return defineStore(options.name, () => {
    // State
    const items = ref<T[]>([]) as Ref<T[]>
    const loading = ref(false)
    const error = ref<LMiXError | null>(null)

    // Getters
    const getItem = computed(() => {
      return (uuid: string) => items.value.find(item => item.uuid === uuid)
    })

    const getNavigation = computed(() => {
      const sortFn = options.sortItems ?? ((a: T, b: T) => a.name.localeCompare(b.name))
      return items.value
        .sort((a, b) => sortFn(a as T, b as T))
        .map((item): VerticalNavigationLink => ({
          label: item.name,
          to: `${options.navigationPathPrefix}/${item.uuid}`,
        }))
    })

    const getOptions = computed(() => [
      { label: `Select a ${options.name}…`, value: '' },
      ...items.value
        .sort((a, b) => (options.sortItems ?? ((x: T, y: T) => x.name.localeCompare(y.name)))(a as T, b as T))
        .map(item => ({
          label: item.name,
          value: item.uuid,
        })),
    ])

    const getCount = computed(() => items.value.length)

    // Actions
    async function selectItems(): Promise<void> {
      if (items.value.length > 0) return

      loading.value = true
      error.value = null

      try {
        const client = useSupabaseClient<Database>()
        const { data, error: apiError } = await client
          .from(options.tableName)
          .select(options.selectQuery ?? '*')
          .order('created_at', { ascending: false })

        if (apiError) throw new LMiXError(apiError.message, 'API_ERROR', apiError)

        items.value = options.transformResponse ? options.transformResponse(data) : (data as unknown as T[])
      }
      catch (e) {
        error.value = e as LMiXError
        if (import.meta.dev) console.error(`${options.name} selection failed:`, e)
        throw e
      }
      finally {
        loading.value = false
      }
    }

    async function upsertItem(item: Partial<T> & { user_uuid: string }): Promise<string | null> {
      loading.value = true
      error.value = null

      const isUpdate = 'uuid' in item && !!item.uuid
      const original = [...items.value]
      let tempId: string | null = null

      if (isUpdate) {
        const index = items.value.findIndex(i => i.uuid === (item as T).uuid)
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...item } as T
        }
      } else {
        tempId = crypto.randomUUID()
        const newItem = {
          ...item,
          uuid: tempId,
          created_at: new Date().toISOString(),
        } as unknown as T
        items.value.unshift(newItem)
      }

      try {
        const client = useSupabaseClient<Database>()
        const { data, error: apiError } = await client
          .from(options.tableName)
          .upsert(item as any)
          .select()

        if (apiError) throw new LMiXError(apiError.message, 'API_ERROR', apiError)

        if (data?.[0]) {
          const newItem = data[0] as UnwrapRef<T>
          if (isUpdate) {
            const index = items.value.findIndex(i => i.uuid === newItem.uuid)
            if (index !== -1) {
              items.value[index] = newItem as T
            }
          } else if (tempId) {
            const tempIndex = items.value.findIndex(i => i.uuid === tempId)
            if (tempIndex !== -1) {
              items.value[tempIndex] = newItem as T
            }
          }
          return newItem.uuid
        }

        return null
      }
      catch (e) {
        items.value = original
        error.value = e as LMiXError
        if (import.meta.dev) console.error(`${options.name} upsert failed:`, e)
        throw e
      }
      finally {
        loading.value = false
      }
    }

    async function deleteItem(uuid: string): Promise<void> {
      loading.value = true
      error.value = null

      const original = [...items.value]
      items.value = items.value.filter(item => item.uuid !== uuid)

      try {
        const client = useSupabaseClient<Database>()
        const { error: apiError } = await client
          .from(options.tableName)
          .delete()
          .eq('uuid', uuid)

        if (apiError) throw new LMiXError(apiError.message, 'API_ERROR', apiError)
      }
      catch (e) {
        items.value = original
        error.value = e as LMiXError
        if (import.meta.dev) console.error(`${options.name} deletion failed:`, e)
        throw e
      }
      finally {
        loading.value = false
      }
    }

    return {
      items,
      loading,
      error,
      getItem,
      getNavigation,
      getOptions,
      getCount,
      selectItems,
      upsertItem,
      deleteItem,
    }
  })
} 