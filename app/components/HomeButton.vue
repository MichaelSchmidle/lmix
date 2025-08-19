<template>
  <UTooltip :content="{ side: 'right' }" :text="t('home')">
    <ULink :to="$localePath('index')" variant="link">
      <LogoType class="h-4" />
    </ULink>
  </UTooltip>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local', })
</script>

<i18n lang="yaml">
en:
  home: 'Home'
</i18n>