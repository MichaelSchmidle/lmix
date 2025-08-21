<template>
  <UDropdownMenu :items="items">
    <UTooltip
      :content="{ side: 'right' }"
      :text="t('userMenu')"
    >
      <UAvatar
        :alt="
          typeof user?.userInfo?.name === 'string'
            ? user.userInfo.name
            : undefined
        "
        class="cursor-pointer"
      />
    </UTooltip>

    <template #loggedInAs>
      <UUser
        :avatar="{
          alt:
            typeof user?.userInfo?.name === 'string'
              ? user.userInfo.name
              : undefined,
        }"
        :name="
          typeof user?.userInfo?.name === 'string'
            ? user.userInfo.name
            : undefined
        "
        :description="
          typeof user?.userInfo?.email === 'string'
            ? user.userInfo.email
            : undefined
        "
      />
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/types'

const config = useRuntimeConfig()
const colorMode = useColorMode()
const { t } = useI18n()
const { user, logout } = useOidcAuth()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      class: 'font-normal',
      slot: 'loggedInAs',
      type: 'label',
    },
  ],
  [
    {
      class: 'cursor-pointer',
      icon: isDark.value ? 'i-ph-sun' : 'i-ph-moon',
      label: isDark.value ? t('lightMode') : t('darkMode'),
      onSelect: () => {
        isDark.value = !isDark.value
      },
    },
  ],
  [
    {
      icon: 'i-ph-user',
      label: t('account'),
      target: '_blank',
      to: config.public.AUTH_DOMAIN
        ? `https://${config.public.AUTH_DOMAIN}/ui/console/users/me`
        : '#',
    },
    {
      class: 'cursor-pointer',
      icon: 'i-ph-sign-out',
      label: t('logout'),
      onSelect: () => {
        logout()
      },
    },
  ],
])
</script>

<i18n lang="yaml">
en:
  userMenu: User Menu
  lightMode: Light Mode
  darkMode: Dark Mode
  account: Account
  logout: Logout
</i18n>
