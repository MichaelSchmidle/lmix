<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Production, ProductionWithRelationsInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const user = useSupabaseUser()
const productionStore = useProductionStore()
const worldStore = useWorldStore()
const scenarioStore = useScenarioStore()
const assistantStore = useAssistantStore()
const personaStore = usePersonaStore()
const relationStore = useRelationStore()

const props = defineProps({
  production: {
    type: Object as PropType<Production>,
    default: undefined,
  },
})

const { getWorldOptions } = storeToRefs(worldStore)
const { getScenarioOptions } = storeToRefs(scenarioStore)
const { getAssistantOptions } = storeToRefs(assistantStore)
const { getPersonaOptions } = storeToRefs(personaStore)
const { getRelationOptions } = storeToRefs(relationStore)
const isUpdate = computed(() => !!props.production)
const isExtended = ref(props.production ? true : false)

const handleSubmit = async (form: ProductionWithRelationsInsert, node: FormKitNode) => {
  try {
    const uuid = await productionStore.upsertProduction(
      {
        ...form,
        uuid: props.production?.uuid,
        user_uuid: user.value!.id,
      } as ProductionWithRelationsInsert,
      {
        assistantUuids: form.production_assistant_uuids || [],
        personaUuids: form.production_persona_uuids || [],
        relationUuids: form.production_relation_uuids || [],
      }
    )

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'productionUpdated' : 'productionCreated'),
    })

    navigateTo(`/productions/${uuid}`)
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('saveFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-film-script-thin" :title="t(production ? 'titleUpdate' : 'titleCreate')" :description="t(production ? 'descriptionUpdate' : 'descriptionCreate')">
    <div class="flex justify-end max-w-prose px-4">
      <UCheckbox v-model="isExtended" :label="t('isExtended.label')" />
    </div>
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="production">
        <FormKit type="text" name="name" :label="t('name.label')" />
        <FormKit type="taglist" name="production_assistant_uuids" :label="t('assistants.label')" :options="getAssistantOptions" :placeholder="t('assistants.placeholder')" validation="required" :validation-messages="{ required: t('assistants.required') }" />
        <FormKit type="dropdown" name="scenario_uuid" :label="t('scenario.label')" :options="getScenarioOptions" :placeholder="t('scenario.placeholder')" />
        <template v-if="isExtended">
          <FormKit type="taglist" name="production_persona_uuids" :label="t('personas.label')" :help="t('personas.help')" :options="getPersonaOptions" :placeholder="t('personas.placeholder')" />
          <FormKit type="taglist" name="production_relation_uuids" :label="t('relations.label')" :options="getRelationOptions" :placeholder="t('relations.placeholder')" />
          <FormKit type="dropdown" name="world_uuid" :label="t('world.label')" :options="getWorldOptions" :placeholder="t('world.placeholder')" />
        </template>
        <template #actions>
          <UiFormActions>
            <ProductionsDeleteModal v-if="production" :production="production" @success="navigateTo('/productions/new')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'" :label="t(isUpdate ? 'updateProduction' : 'createProduction')" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    titleCreate: Create Production
    titleUpdate: Update Production
    descriptionCreate: Bring personas, scenarios and worlds to life with a new production.
    descriptionUpdate: Update this production’s configuration.
    name:
      label: Name
    assistants:
      label: Assistants
      placeholder: Select an assistant…
      required: At least one assistant is required.
    scenario:
      label: Scenario
      placeholder: Select a scenario…
    personas:
      label: Personas
      help: Add the personas that you as user will represent in this production.
      placeholder: Select a persona…
    relations:
      label: Relations
      placeholder: Select a relation…
    world:
      label: World
      placeholder: Select a world…
    isExtended:
      label: Show extended settings
    createProduction: Create
    updateProduction: Update
    productionCreated: Production created.
    productionUpdated: Production updated.
    saveFailed: Failed to save production.
</i18n>