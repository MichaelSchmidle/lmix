<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Scenario, ScenarioInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const scenarioStore = useScenarioStore()

const props = defineProps({
  scenario: {
    type: Object as PropType<Scenario>,
    default: undefined,
  },
})

const isUpdate = computed(() => !!props.scenario)

const handleSubmit = async (form: Partial<ScenarioInsert>, node: FormKitNode) => {
  try {
    const uuid = await scenarioStore.upsertScenario({
      ...form,
      uuid: props.scenario?.uuid,
    } as ScenarioInsert)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'scenarioUpdated' : 'scenarioCreated'),
    })

    navigateTo(`/scenarios/${uuid}`)
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('saveFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-panorama-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleInsert')"
    :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionInsert')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="scenario">
        <FormKit type="text" name="name" :label="t('name.label')" validation="required"
          :validation-messages="{ required: t('name.required') }" />
        <FormKit type="textarea" auto-height name="description" :label="t('description.label')"
          :help="t('description.help')" />
        <template #actions="{ disabled }">
          <UiFormActions>
            <ScenariosDeleteModal v-if="scenario" :scenario="scenario" @success="navigateTo('/scenarios/add')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'"
              :label="t(isUpdate ? 'updateScenario' : 'createScenario')" :loading="(disabled as boolean)"
              type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
en:
  titleInsert: Create
  titleUpdate: Update
  descriptionInsert: Create a new scenario to set the stage for your productions.
  descriptionUpdate: Configure this scenario’s name and description.
  name:
    label: Name
    required: Name is required
  description:
    label: Description
    help: Provide context about the setting as starting point for your production from which it can evolve. Define instructions shared by all assistants in this scenario.
    required: Description is required
  createScenario: Create Scenario
  updateScenario: Update
  scenarioCreated: Scenario created.
  scenarioUpdated: Scenario updated.
  saveFailed: Failed to save scenario.
</i18n>