<script setup>
useHead({
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
