export default defineAppConfig({
  ui: {
    primary: 'indigo',
    gray: 'stone',

    icons: {
      dark: 'i-ph-moon-duotone',
      light: 'i-ph-sun-duotone',
      system: 'i-ph-devices',
      search: 'i-ph-magnifying-glass',
      external: 'i-ph-arrow-square-out',
      chevron: 'i-ph-caret-down',
      hash: 'i-ph-hash',
      menu: 'i-ph-list',
      close: 'i-ph-x',
      check: 'i-ph-check'
    },

    accordion: {
      default: {
        class: 'hover:bg-gray-200 dark:hover:bg-gray-800 w-full',
        closeIcon: 'i-ph-caret-up',
        openIcon: 'i-ph-caret-down',
      },
      item: {
        padding: '',
      },
    },
    button: {
      default: {
        loadingIcon: 'i-ph-circle-notch',
      },
    },
    card: {
      body: {
        base: 'px-4 sm:px-4 py-3 sm:py-3 space-y-8',
      },
      footer: {
        base: 'px-4 sm:px-4 py-3 sm:py-3',
      },
      header: {
        base: 'px-4 sm:px-4 py-3 sm:py-3',
      },
    },
    container: {
      base: 'space-y-8 lg:space-y-12',
      constrained: 'md:max-w-prose',
      padding: '',
    },
    divider: {
      container: {
        base: 'font-normal text-inherit dark:text-inherit prose prose-sm dark:prose-invert',
      },
      default: {
        type: 'dotted',
      },
    },
    modal: {
      overlay: {
        background: 'bg-white/80 dark:bg-black/80',
        base: 'backdrop-blur-sm',
      },
    },
    notifications: {
      // Show toasts at the top right of the screen
      position: 'top-0 bottom-[unset]'
    },
    select: {
      default: {
        selectedIcon: 'i-ph-check',
        trailingIcon: 'i-ph-caret-down',
      },
    },
    selectMenu: {
      default: {
        selectedIcon: 'i-ph-check',
      },
    },
    skeleton: {
      background: 'bg-gray-200 dark:bg-gray-800',
    },
    slideover: {
      overlay: {
        background: 'bg-white/80 dark:bg-black/80',
        base: 'backdrop-blur-sm',
      },
    },
    verticalNavigation: {
      active: 'before:bg-white dark:before:bg-black',
      inactive: 'hover:before:bg-gray-200 dark:hover:before:bg-gray-800',
    },
  },
})
