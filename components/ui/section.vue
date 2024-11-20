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
  orientation: {
    type: String as PropType<'vertical' | 'horizontal'>,
    default: 'horizontal'
  }
})

// Compute styles based on orientation
const styles = computed(() => ({
  wrapper: {
    vertical: 'space-y-3',
    horizontal: 'grid md:grid-cols-3 items-start gap-4'
  },
  container: {
    vertical: 'items-center',
    horizontal: 'md:col-span-1 md:flex-col flex-row'
  },
  content: {
    vertical: '',
    horizontal: 'md:col-span-2'
  }
}))
</script>

<template>
  <div :class="['max-w-7xl', styles.wrapper[orientation]]">
    <div :class="['flex flex-wrap gap-4', styles.container[orientation]]">
      <div class="flex items-start gap-2">
        <div v-if="icon || $slots.icon" class="inline-flex">
          <slot name="icon">
            <UIcon v-if="icon" :name="icon" class="w-12 h-12 flex-shrink-0 text-black dark:text-white" />
          </slot>
        </div>
        <div>
          <h4 v-if="title || $slots.title" class="text-black dark:text-white font-semibold">
            <slot name="title">{{ title }}</slot>
          </h4>
          <div v-if="description || $slots.description" class="text-sm text-gray-500 dark:text-gray-400">
            <slot name="description">{{ description }}</slot>
          </div>
        </div>
      </div>
    </div>
    <div :class="['space-y-3', styles.content[orientation]]">
      <slot />
    </div>
  </div>
</template>
