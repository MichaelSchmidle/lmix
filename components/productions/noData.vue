<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const assistantStore = useAssistantStore()
const { getAssistant } = storeToRefs(assistantStore)

const props = defineProps({
  assistantUuids: {
    required: true,
    type: Array as PropType<string[]>,
  },
})
</script>

<template>
  <UContainer class="max-w-prose w-full">
    <UiHero icon="i-ph-popcorn-thin" :title="t('title')" :description="t('description')" />
    <UDivider>{{ t('startWith') }}</UDivider>
    <div class="flex flex-wrap gap-x-4 gap-y-3 justify-center">
      <UButton v-for="assistantUuid in props.assistantUuids" :key="assistantUuid" color="cyan" :label="getAssistant(assistantUuid)?.name" size="lg" />
    </div>
  </UContainer>
</template>

<i18n lang="yaml">
  en:
    title: A New Story Awaits
    description: Take the first turn to start your production – or simply trigger an assistant to get it started for you.
    startWith: Start With
</i18n>
