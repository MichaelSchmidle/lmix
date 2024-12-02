<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
</script>

<template>
  <div :class="twMerge('flex items-center justify-between min-h-16 px-4 py-3', $attrs.class as string)">
    <slot name="domainToggle" />
    <div class="flex items-center font-bold truncate">
      <slot />
    </div>
    <slot name="mainToggle" />
  </div>
</template>
