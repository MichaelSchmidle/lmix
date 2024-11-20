<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const assistantStore = useAssistantStore()
const { getAssistantNavigation } = storeToRefs(assistantStore)

const props = defineProps({
  isSlideover: {
    default: false,
    type: Boolean,
  },
})
</script>

<template>
  <UiPanelHeader>
    <template v-if="isSlideover" #domainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
    {{ t('title') }}
  </UiPanelHeader>
  <UiPanelContent v-auto-animate>
    <UButton block icon="i-ph-head-circuit-duotone" :label="t('newAssistant')" to="/assistants/add" />
    <UVerticalNavigation :links="getAssistantNavigation()" />
    <NoData v-if="!getAssistantNavigation().length" :message="t('noAssistants')" />
  </UiPanelContent>
</template>

<i18n lang="yaml">
  en:
    title: Assistants
    newAssistant: New Assistant
    noAssistants: No assistants yet
</i18n>
