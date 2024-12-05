<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const { currentVersion, latestVersion, hasUpdate, checkForUpdates } = useVersionCheck()

const isModalOpen = ref(false)

onMounted(() => {
  checkForUpdates()
})
</script>

<template>
  <div>
    <UChip color="orange" size="xs" :show="hasUpdate">
      <UTooltip :popper="{ placement: 'left' }" :text="t(hasUpdate ? 'update.title' : 'info.title')">
        <UButton class="font-mono" :label="currentVersion" color="gray" size="xs" variant="soft" @click="isModalOpen = true" />
      </UTooltip>
    </UChip>
    <UModal :ui="{ width: 'max-w-sm sm:max-w-sm' }" v-model="isModalOpen">
      <UCard>
        <template #header>
          <Logotype class="text-primary h-4 w-auto" />
        </template>
        <SparkleSvg />
        <div class="prose dark:prose-invert prose-sm">
          <h4>{{ t('info.title') }}</h4>
          <i18n-t keypath="info.description" tag="p">
            <template #current>
              <code>{{ currentVersion }}</code>
            </template>
          </i18n-t>
          <template v-if="hasUpdate">
            <UAlert class="not-prose" color="orange" icon="i-ph-arrow-fat-line-up-fill" :title="t('update.title')" variant="subtle" />
            <i18n-t keypath="update.description" tag="p">
              <template #latest>
                <code>{{ latestVersion }}</code>
              </template>
            </i18n-t>
            <ol>
              <li>
                <pre>docker compose down</pre>
              </li>
              <li>
                <pre>docker compose pull</pre>
              </li>
              <li>
                <pre>docker compose up -d</pre>
              </li>
            </ol>
          </template>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
en:
  info:
    title: Version Information
    description: LMiX is currently running in version {current}.
  update:
    title: Update Available
    description: 'An update to {latest} is available. To upgrade LMiX to the latest release, run:'
</i18n>
