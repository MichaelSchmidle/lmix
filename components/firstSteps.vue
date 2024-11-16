<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
</script>

<template>
  <div class="space-y-6">
    <div class="prose dark:prose-invert">
      <p>{{ t('description') }}</p>
      <ul class="prose-a:no-underline list-none">
        <li class="flex items-center gap-2">
          <UIcon class="h-5 w-5" name="i-ph-circle" />
          <UButton icon="i-ph-circuitry-duotone" :label="t('newModel')" to="/models/new" />
        </li>
        <li class="flex items-center gap-2">
          <UIcon class="h-5 w-5" name="i-ph-circle" />
          <UButton icon="i-ph-mask-happy-duotone" :label="t('newPersona')" to="/personas/new" />
        </li>
        <li class="flex items-center gap-2">
          <UIcon class="h-5 w-5" name="i-ph-circle" />
          <UButton icon="i-ph-head-circuit-duotone" :label="t('newAssistant')" to="/assistants/new" />
        </li>
      </ul>
    </div>
  </div>
</template>

<i18n lang="yaml">
  en:
    description: 'To get you started, let’s set up your LMiX and create:'
    newModel: 'New Model'
    newPersona: 'New Persona'
    newAssistant: 'New Assistant'
</i18n>
