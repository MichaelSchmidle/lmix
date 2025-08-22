<template>
  <PagePanel
    route="models-id"
    :title="title"
  >
    <template #toolbar>
      <USkeleton
        v-if="loading"
        class="h-5 w-64"
      />

      <div
        v-else
        class="text-sm truncate"
      >
        {{ model?.name }}
      </div>

      <ModelsDelete />
    </template>

    <ModelsUpdate />
  </PagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const modelStore = useModelStore()
const { loading } = storeToRefs(modelStore)
const model = computed(() =>
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
