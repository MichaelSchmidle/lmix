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
const turnStore = useTurnStore()

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

const handleSubmit = async (message: UserTurnMessage, node: FormKitNode) => {
  try {
    // First handle the user message
    await turnStore.triggerTurn(message)

    // Reset the form
    node.reset({
      sending_persona_uuid: message.sending_persona_uuid,
      receiving_assistant_uuid: message.receiving_assistant_uuid,
    })
  }
  catch (error) {
    console.error('Failed to send message:', error)
  }
}
</script>

<template>
  <FormKit type="form" :actions="false" :incomplete-message="false" name="message" #default="{ disabled, node }"
    @submit="handleSubmit">
    <FormKit type="meta" name="production_uuid" :value="production.uuid" />
    <FormKit auto-height :max-auto-height="256" name="performance" :placeholder="t('performance.placeholder')"
      type="textarea" @keydown.enter.exact.prevent="node.submit()">
      <template #help="context">
        <i18n-t :class="context.classes.help" keypath="performance.help" tag="div">
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
        <FormKit type="dropdown" name="sending_persona_uuid" :options="personaOptions"
          :placeholder="t('persona.placeholder')" :help="t('persona.help')" :value="defaultPersona" />
      </div>
      <div class="flex-1">
        <FormKit type="dropdown" name="receiving_assistant_uuid" :options="assistantOptions"
          :placeholder="t('assistant.placeholder')"
          :help="t('assistant.help')" :value="defaultAssistant" required validation="required"
          :validation-messages="{ required: t('assistant.required') }" />
      </div>
      <UTooltip :shortcuts="['↵']" :text="t('send.tooltip')">
        <UButton color="cyan" icon="i-ph-paper-plane-tilt-duotone" :loading="disabled as boolean" size="lg" square type="submit" />
      </UTooltip>
    </div>
  </FormKit>
</template>

<i18n lang="yaml">
en:
  performance:
    placeholder: Your turn…
    help: Press {enter} to send, {shiftEnter} for new lines.
    submitted: Message sent.
    failed: Failed to send message.
    unexpectedError: An unexpected error occurred.
  persona:
    placeholder: Persona…
    help: Select the persona you represent in your turn.
  assistant:
    placeholder: Assistant…
    help: Select the assistant to take the next turn.
    required: Please select an assistant.
  send:
    tooltip: Send
</i18n>
