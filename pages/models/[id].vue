<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const modelStore = useModelStore()
const { getModel } = storeToRefs(modelStore)
const model = getModel.value(route.params.id as string)

if (!model) {
  showError({
    statusCode: 404,
    message: t('modelNotFound'),
  })
}

useHead({
  title: t('title', { name: model?.id }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <ModelsPanelSlideover class="lg:hidden" />
      </template>
      {{ model?.id }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <UiSection icon="i-ph-circuitry-thin" :title="t('manageModel.title')" :description="t('manageModel.description')">
        <UCard>
          <dl class="prose dark:prose-invert w-full">
            <dt>{{ t('modelId') }}</dt>
            <dd><code>{{ model?.id }}</code></dd>
            <dt>{{ t('modelApiEndpoint') }}</dt>
            <dd><code>{{ model?.api_endpoint }}</code></dd>
          </dl>
          <UiFormActions>
            <ModelsDeleteModal v-if="model" :model="model" @success="navigateTo('/models')" />
          </UiFormActions>
        </UCard>
      </UiSection>
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: Model {name}
  modelNotFound: Model not found
  manageModel:
    title: Manage Model
    description: View the configuration of this model or remove it from LMiX.
  modelId: Model ID
  modelApiEndpoint: API Endpoint
</i18n>
