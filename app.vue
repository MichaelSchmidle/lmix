<script setup>
useHead({
  templateParams: {
    separator: '·'
  },
  titleTemplate: 'LMiX %separator %s'
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="primary" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>