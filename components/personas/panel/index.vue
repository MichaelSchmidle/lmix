<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const personaStore = usePersonaStore()
const { getPersonaNavigation } = storeToRefs(personaStore)

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
    <UButton block icon="i-ph-mask-happy-duotone" :label="t('newPersona')" to="/personas/add" />
    <UVerticalNavigation :links="getPersonaNavigation()" />
    <NoData v-if="!getPersonaNavigation().length" :message="t('noPersonas')" />
  </UiPanelContent>
</template>

<i18n lang="yaml">
  en:
    title: Personas
    newPersona: New Persona
    noPersonas: No personas yet
</i18n>
