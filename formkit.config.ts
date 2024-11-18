// formkit.config.{ts|js}
import { defineFormKitConfig } from '@formkit/vue'
import { genesisIcons } from '@formkit/icons'
import { createAutoAnimatePlugin } from '@formkit/addons'
import { createProPlugin, dropdown, taglist } from '@formkit/pro'
import { rootClasses } from './formkit.theme'

// Create the Pro plugin
const proPlugin = createProPlugin('fk-81a7006971b', {
  dropdown,
  taglist,
})

export default defineFormKitConfig({
  config: {
    rootClasses: rootClasses,
  },
  icons: {
    ...genesisIcons,
  },
  plugins: [
    proPlugin,
    createAutoAnimatePlugin(),
  ],
})