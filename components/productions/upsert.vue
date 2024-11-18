<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Production, ProductionInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const user = useSupabaseUser()
const productionStore = useProductionStore()
const worldStore = useWorldStore()
const scenarioStore = useScenarioStore()
const assistantStore = useAssistantStore()
const personaStore = usePersonaStore()

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

const isUpdate = computed(() => !!props.production)

const handleSubmit = async (form: ProductionInsert, node: FormKitNode) => {
  try {
    const uuid = await productionStore.upsertProduction({
      ...form,
      uuid: props.production?.uuid,
      user_uuid: user.value!.id,
    } as ProductionInsert)

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
  <UiSection icon="i-ph-film-script-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleCreate')" :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionCreate')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="production">
        <FormKit type="text" name="name" :label="t('name.label')" />
        <FormKit type="select" name="world_uuid" :label="t('world.label')" :options="getWorldOptions" />
        <FormKit type="select" name="scenario_uuid" :label="t('scenario.label')" :options="getScenarioOptions" />
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
    descriptionCreate: Create a new production to bring your world and scenario to life.
    descriptionUpdate: Update this production's configuration.
    name:
      label: Name
      required: Name is required.
    world:
      label: World
    scenario:
      label: Scenario
    createProduction: Create
    updateProduction: Update
    productionCreated: Production created.
    productionUpdated: Production updated.
    saveFailed: Failed to save production.
</i18n>