<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const modelStore = useModelStore()
const { getModelNavigation } = storeToRefs(modelStore)

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
    <UButton block icon="i-ph-circuitry-duotone" :label="t('newModel')" to="/models/add" />
    <UAccordion color="gray" default-open :items="getModelNavigation('i-ph-hard-drive-duotone')" variant="ghost"
      :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
      <template #item="{ item }">
        <UVerticalNavigation :links="item.content" />
      </template>
    </UAccordion>
    <NoData v-if="!getModelNavigation().length" :message="t('noModels')" />
  </UiPanelContent>
</template>

<i18n lang="yaml">
en:
  title: Models
  newModel: New Model
  noModels: No models yet
</i18n>
