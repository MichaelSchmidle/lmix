<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()
const toast = useToast()
const { exportData } = useExport()

const userItems = computed(() => {
  const baseItems = [
    [
      {
        class: 'cursor-auto',
        label: t('colorMode'),
        slot: 'colorMode',
      },
    ],
  ]

  if (user.value) {
    return [
      [
        {
          class: 'hover:bg-inherit dark:hover:bg-inherit cursor-auto select-text text-gray-500 dark:text-gray-400 text-start',
          label: t('account', { email: user.value.email }),
          slot: 'account',
        },
      ],
      ...baseItems,
      [
        {
          click: handleExport,
          icon: 'i-ph-download-simple',
          label: t('export'),
        },
        {
          click: handleSignOut,
          icon: 'i-ph-sign-out',
          label: t('signOut'),
        },
      ],
    ]
  }

  return baseItems
})


const handleSignOut = () => {
  navigateTo('/sign-in')
}

const handleExport = () => {
  try {
    exportData()
  }
  catch (error) {
    console.error(error)
    toast.add({
      color: 'rose',
      icon: 'i-ph-x-circle',
      title: t('export.error'),
    })
  }
}
</script>

<template>
  <UDropdown :items="userItems">
    <UTooltip :popper="{ placement: 'right' }" :text="t('title')">
      <UButton color="gray" icon="i-ph-user" square variant="ghost" :ui="{ rounded: 'rounded-full' }" />
    </UTooltip>
    <template v-if="user" #account>
      <i18n-t keypath="account" tag="span" @click.stop>
        <template #email><strong class="truncate">{{ user.email }}</strong></template>
      </i18n-t>
    </template>
    <template #colorMode>
      <div class="flex flex-1 items-center justify-between" @click.stop>
        <span class="cursor-text">{{ t('colorMode') }}</span>
        <UiColorModeToggle />
      </div>
    </template>
  </UDropdown>
</template>

<i18n lang="yaml">
en:
  title: User Menu
  account: Signed in as {email}
  colorMode: Color Mode
  colorTheme: Color Theme
  export: Export Repertoire
  exportError: Failed to export data
  signOut: Sign Out
</i18n>
