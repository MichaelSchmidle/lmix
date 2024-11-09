export default defineAppConfig({
  ui: {
    primary: 'indigo',
    gray: 'neutral',

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

    button: {
      default: {
        loadingIcon: 'i-ph-circle-notch',
      },
    },
    dashboard: {
      navbar: {
        wrapper: 'border-gray-200 dark:border-gray-800',
      },
      panel: {
        border: 'border-none',
      },
      sidebar: {
        links: {
          active: 'before:bg-white dark:before:bg-black',
          inactive: 'hover:before:bg-gray-200 dark:hover:before:bg-gray-800',
          trailingIcon: {
            base: 'h-4 w-4',
            name: 'i-ph-caret-up',
            inactive: 'rotate-180'
          },
        },
      },
    },
    notifications: {
      // Show toasts at the top right of the screen
      position: 'top-0 bottom-[unset]'
    },
    page: {
      hero: {
        icon: {
          base: 'h-12 w-12',
        },
        title: 'font-serif font-normal',
      },
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
  },
})
