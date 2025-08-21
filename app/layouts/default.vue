<template>
  <UDashboardGroup>
    <UDashboardSidebar
      class="w-64"
      toggle-side="right"
    >
      <template #header>
        <HomeButton />
      </template>
      <NavigationMenu />
      <ProductionsCreateButton size="lg" />
      <Productions />
      <template #footer>
        <UserMenu />
      </template>
    </UDashboardSidebar>
    <NuxtPage />
  </UDashboardGroup>
</template>
