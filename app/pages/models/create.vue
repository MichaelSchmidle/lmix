<template>
  <UDashboardPanel id="models-create-panel">
    <template #header>
      <UDashboardNavbar :title="title" toggle-side="right">
        <template #leading>
          <UButton class="xl:hidden" color="neutral" icon="i-ph-arrow-left" :to="localeRoute('models')" variant="ghost" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="max-w-prose">
        <ModelsCreateWizard @cancel="handleCancel" @success="handleSuccess" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocalePath()
const router = useRouter()
const title = t('create')

useHead({
  title: title,
})

function handleCancel() {
  router.push(localeRoute('/models'))
}

function handleSuccess() {
  // Navigation handled by the wizard
}
</script>

<i18n lang="yaml">
en:
  create: Add Models
</i18n>
