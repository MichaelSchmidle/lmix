<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const modelStore = useModelStore()
const personaStore = usePersonaStore()
const assistantStore = useAssistantStore()

const { models } = storeToRefs(modelStore)
const { personas } = storeToRefs(personaStore)
const { assistants } = storeToRefs(assistantStore)
</script>

<template>
  <div class="space-y-8">
    <div class="prose dark:prose-invert">
      <p>{{ t('description') }}</p>
      <ul class="prose-a:no-underline list-none">
        <li class="flex items-center gap-2">
          <UIcon v-if="models.length" class="h-5 text-lime-500 dark:text-lime-400 w-5" name="i-ph-check-circle-fill" />
          <UIcon v-else class="h-5 text-gray-500 dark:text-gray-400 w-5" name="i-ph-circle-duotone" />
          <UButton icon="i-ph-circuitry-duotone" :label="t('newModel')" to="/models/add" />
        </li>
        <li class="flex items-center gap-2">
          <UIcon v-if="personas.length" class="h-5 text-lime-500 dark:text-lime-400 w-5" name="i-ph-check-circle-fill" />
          <UIcon v-else class="h-5 text-gray-500 dark:text-gray-400 w-5" name="i-ph-circle-duotone" />
          <UButton icon="i-ph-mask-happy-duotone" :label="t('newPersona')" to="/personas/add" />
        </li>
        <li class="flex items-center gap-2">
          <UIcon v-if="assistants.length" class="h-5 text-lime-500 dark:text-lime-400 w-5" name="i-ph-check-circle-fill" />
          <UIcon v-else class="h-5 text-gray-500 dark:text-gray-400 w-5" name="i-ph-circle-duotone" />
          <UButton icon="i-ph-head-circuit-duotone" :label="t('newAssistant')" to="/assistants/add" />
        </li>
      </ul>
    </div>
  </div>
</template>

<i18n lang="yaml">
  en:
    description: 'To get you started, let’s set up your LMiX and create:'
    newModel: 'New Models'
    newPersona: 'New Persona'
    newAssistant: 'New Assistant'
</i18n>
