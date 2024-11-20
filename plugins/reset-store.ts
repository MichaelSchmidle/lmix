import { defineNuxtPlugin } from '#app'
import { cloneDeep } from 'lodash-es'
import type { Pinia, PiniaPluginContext } from 'pinia'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia
  pinia.use(({ store }: PiniaPluginContext) => {
    const initialState = cloneDeep(store.$state)
    store.$reset = () => store.$patch(cloneDeep(initialState))
  })
}) 