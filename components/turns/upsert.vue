<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { CreateMessage } from 'ai'
import { useChat } from '@ai-sdk/vue'
import type { Production, UserTurnMessage } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionAssistants, getProductionPersonas } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistantOptions } = storeToRefs(assistantStore)
const personaStore = usePersonaStore()
const { getPersona, getPersonaOptions } = storeToRefs(personaStore)
const turnStore = useTurnStore()
const { insertUserTurn } = turnStore

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

const { append } = useChat({
  api: '/api/turns',
  id: props.production.uuid,
})

const personaOptions = computed(() => getPersonaOptions.value(getProductionPersonas.value(props.production.uuid)))
const assistantOptions = computed(() => getAssistantOptions.value(getProductionAssistants.value(props.production.uuid)))

const defaultPersona = computed(() => personaOptions.value.length === 1 ? personaOptions.value[0].value : undefined)
const defaultAssistant = computed(() => assistantOptions.value.length === 1 ? assistantOptions.value[0].value : undefined)

const handleSubmit = async (userMessage: UserTurnMessage, node: FormKitNode) => {
  try {
    if (userMessage.performance) {
      await insertUserTurn(userMessage)
    }

    const message: CreateMessage = {
      role: 'user',
      content: JSON.stringify({
        persona_name: userMessage.sending_persona_uuid ? getPersona.value(userMessage.sending_persona_uuid)?.name : 'User',
        performance: userMessage.performance
      })
    }

    await append(message, {
      body: {
        production_uuid: userMessage.production_uuid,
        assistant_uuid: userMessage.receiving_assistant_uuid
      },
    })

    node.reset({
      sending_persona_uuid: userMessage.sending_persona_uuid,
      receiving_assistant_uuid: userMessage.receiving_assistant_uuid,
    })
  }
  catch (e) { }
  finally { }
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
          :placeholder="t('assistant.placeholder')" :help="t('assistant.help')" :value="defaultAssistant" required
          validation="required" :validation-messages="{ required: t('assistant.required') }" />
      </div>
      <UTooltip :shortcuts="['Enter']" :text="t('send.tooltip')">
        <UButton color="cyan" icon="i-ph-paper-plane-tilt-duotone" :loading="disabled as boolean" size="lg" square
          type="submit" />
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
