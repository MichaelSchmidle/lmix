<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Production, UserTurnMessage } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionAssistants, getProductionPersonas } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistantOptions } = storeToRefs(assistantStore)
const personaStore = usePersonaStore()
const { getPersonaOptions } = storeToRefs(personaStore)

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

const personaOptions = computed(() => getPersonaOptions.value(getProductionPersonas.value(props.production.uuid)))
const assistantOptions = computed(() => getAssistantOptions.value(getProductionAssistants.value(props.production.uuid)))

const defaultPersona = computed(() => personaOptions.value.length === 1 ? personaOptions.value[0].value : undefined)
const defaultAssistant = computed(() => assistantOptions.value.length === 1 ? assistantOptions.value[0].value : undefined)

const handleSubmit = async (values: UserTurnMessage, node: FormKitNode) => {
  try {
    // Clear form content only, keep selections
    node.reset({ persona_uuid: values.persona_uuid, assistant_uuid: values.assistant_uuid })
  }
  catch (e) {

  }
}
</script>

<template>
  <FormKit type="form" :actions="false" :incomplete-message="false" name="message" #default="{ disabled, node }" @submit="handleSubmit">
    <FormKit auto-height :max-auto-height="256" name="content" :placeholder="t('turn.placeholder')" type="textarea" @keydown.enter.exact.prevent="node.submit()" required>
      <template #help="context">
        <i18n-t :class="context.classes.help" keypath="turn.help" tag="div">
          <template #enter>
            <UKbd>Enter</UKbd>
          </template>
          <template #shiftEnter>
            <UKbd>Shift</UKbd> + <UKbd>Enter</UKbd>
          </template>
        </i18n-t>
      </template>
    </FormKit>
    <div class="flex gap-2 sm:gap-4 items-start">
      <div v-if="personaOptions.length" class="flex-1">
        <FormKit type="dropdown" name="persona_uuid" :options="personaOptions" :placeholder="personaOptions.length > 1 ? t('persona.placeholder') : undefined" :help="t('persona.help')" :value="defaultPersona" />
      </div>
      <div class="flex-1">
        <FormKit type="dropdown" name="assistant_uuid" :options="assistantOptions" :placeholder="assistantOptions.length > 1 ? t('assistant.placeholder') : undefined" :help="t('assistant.help')" :value="defaultAssistant" required />
      </div>
      <UTooltip :shortcuts="['↵']" :text="t('send.tooltip')">
        <UButton color="cyan" icon="i-ph-paper-plane-tilt-duotone" :loading="disabled as boolean" size="lg" square type="submit" />
      </UTooltip>
    </div>
  </FormKit>
</template>

<i18n lang="yaml">
en:
  turn:
    placeholder: Your turn…
    streaming: Assistant is responding…
    help: Press {enter} to send, {shiftEnter} for new lines.
  persona:
    placeholder: Persona…
    help: Select the persona you represent in your turn.
  assistant:
    placeholder: Assistant…
    help: Select the assistant to take the next turn.
  send:
    tooltip: Send
  error:
    title: Error
    unknown: An unexpected error occurred
</i18n>
