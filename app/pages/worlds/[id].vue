<template>
  <PagePanel
    route-name="worlds-id"
    :title="title"
  >
    <template #toolbar>
      <div
        v-if="loading"
        class="flex gap-x-4 items-center justify-between w-full"
      >
        <USkeleton class="h-5 w-64" />

        <USkeleton class="h-5 w-24" />
      </div>

      <div
        v-else-if="world"
        class="flex gap-x-4 items-center justify-between w-full"
      >
        <span class="text-sm truncate">{{ world.name }}</span>
        <WorldsDelete :world="world" />
      </div>
    </template>

    <WorldsUpsert :world="world" />
  </PagePanel>
</template>

<script setup lang="ts">
import type { World } from '~/types/worlds'

const { t } = useI18n({ useScope: 'local' })
const worldStore = useWorldStore()
const { loading } = storeToRefs(worldStore)

const world = computed<World | undefined>(() =>
  worldStore.getWorldById(useRoute().params.id as string)
)

const title = t('title')

// Fetch worlds on component mount if not already loaded
onMounted(async () => {
  if (!worldStore.worlds.length) {
    await worldStore.fetchWorlds()
  }
})

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Manage World
</i18n>