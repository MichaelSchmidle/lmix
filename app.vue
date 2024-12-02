<script setup>
useHead({
  bodyAttrs: {
    class: 'bg-white dark:bg-black text-black dark:text-white'
  },
  templateParams: {
    separator: '·'
  },
  titleTemplate: 'LMiX %separator %s'
})
</script>

<template>
  <div v-auto-animate>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="primary" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>
