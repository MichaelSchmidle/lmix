<template>
  <PagePanel
    route-name="models-id"
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
        v-else-if="model"
        class="flex gap-x-4 items-center justify-between w-full"
      >
        <span class="text-sm truncate">{{ model.name }}</span>
        <ModelsDelete :model="model" />
      </div>
    </template>

    <ModelsUpdate :model="model" />
  </PagePanel>
</template>

<script setup lang="ts">
import type { Model } from '~/types/models'

const { t } = useI18n({ useScope: 'local' })
const modelStore = useModelStore()
const { loading } = storeToRefs(modelStore)

const model = computed<Model | undefined>(() =>
  modelStore.getModelById(useRoute().params.id as string)
)

const title = t('title')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Manage Model
</i18n>
