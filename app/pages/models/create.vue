<template>
  <UDashboardPanel id="models-create-panel">
    <template #header>
      <UDashboardNavbar
        :title="title"
        toggle-side="right"
      >
        <template #leading>
          <UButton
            class="xl:hidden"
            color="neutral"
            icon="i-ph-arrow-left"
            :to="localeRoute('models')"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <ModelsDiscoveryWizard
        @cancel="handleCancel"
        @success="handleSuccess"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const localeRoute = useLocalePath()
const router = useRouter()
const title = t('create')

useHead({
  title: title,
})

function handleCancel() {
  router.push(localeRoute('models'))
}

function handleSuccess(models: any[]) {
  // Navigate back to models list after successful creation
  router.push(localeRoute('models'))
}
</script>

<i18n lang="yaml">
en:
  create: Create Models
</i18n>
