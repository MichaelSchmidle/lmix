<script setup lang="ts">
defineProps({
  icon: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  titleTag: {
    type: String,
    default: 'h1',
  },
  descriptionTag: {
    type: String,
    default: 'p',
  },
})
</script>

<template>
  <div class="prose lg:prose-lg xl:prose-xl dark:prose-invert py-12">
    <p>
      <UIcon v-if="icon" :name="icon" class="text-primary h-12 w-12" />
    </p>
    <slot name="title">
      <component :is="titleTag" class="font-serif">{{ title }}</component>
    </slot>
    <slot name="description">
      <component :is="descriptionTag">{{ description }}</component>
    </slot>
  </div>
</template>