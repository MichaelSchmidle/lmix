<script setup lang="ts">
import type { VerticalNavigationLink } from '#ui/types'
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionAssistantUuids, getProductionPersonaUuids, getProductionRelationUuids } = storeToRefs(productionStore)
const { upsertProduction } = productionStore
const personaStore = usePersonaStore()
const { getPersonaNavigation } = storeToRefs(personaStore)
const assistantStore = useAssistantStore()
const { getAssistantNavigation } = storeToRefs(assistantStore)
const relationStore = useRelationStore()
const { getRelationNavigation } = storeToRefs(relationStore)
const scenarioStore = useScenarioStore()
const { getScenarioNavigation } = storeToRefs(scenarioStore)
const worldStore = useWorldStore()
const { getWorldNavigation } = storeToRefs(worldStore)

const props = defineProps({
  isSlideover: {
    default: false,
    type: Boolean,
  },
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

const emit = defineEmits(['close'])

const navigationItems = ref([
  {
    exact: true,
    icon: 'i-ph-slideshow',
    label: t('produce'),
    to: `/productions/${props.production.uuid}`,
  },
  {
    icon: 'i-ph-faders',
    label: t('upsert'),
    to: `/productions/${props.production.uuid}/edit`,
  },
])

const accordionNavigations = ref([
  {
    label: t('ensemble'),
    slot: 'ensemble',
  },
])

const personaNavigation = computed(() => getPersonaNavigation.value(getProductionPersonaUuids.value(props.production.uuid), 'i-ph-mask-happy'))
const assistantNavigation = computed(() => getAssistantNavigation.value(getProductionAssistantUuids.value(props.production.uuid), 'i-ph-head-circuit'))
const relationNavigation = computed(() => getRelationNavigation.value(getProductionRelationUuids.value(props.production.uuid), 'i-ph-share-network'))

const scenarioNavigation = computed(() => {
  // Type guard to ensure scenario_uuid is not null within computed
  if (!props.production.scenario_uuid) return []
  return getScenarioNavigation.value([props.production.scenario_uuid], 'i-ph-panorama')
})

const worldNavigation = computed(() => {
  // Type guard to ensure world_uuid is not null within computed
  if (!props.production.world_uuid) return []
  return getWorldNavigation.value([props.production.world_uuid], 'i-ph-planet')
})

const showDirectives = ref<boolean>(false)
showDirectives.value = props.production.show_directives

const handleDirectiveChange = async () => {
  try {
    await upsertProduction({
      uuid: props.production.uuid,
      show_directives: showDirectives.value,
    })
  }
  catch (error) { }
}
</script>

<template>
  <UiPanelHeader>
    <template v-if="isSlideover" #domainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
    {{ t('title') }}
  </UiPanelHeader>
  <UiPanelContent>
    <UVerticalNavigation :links="navigationItems" />
    <UAccordion color="gray" :items="accordionNavigations" variant="ghost"
      :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
      <template #ensemble>
        <UVerticalNavigation :links="personaNavigation" />
        <UVerticalNavigation :links="assistantNavigation" />
        <UVerticalNavigation :links="relationNavigation" />
        <UVerticalNavigation :links="scenarioNavigation" />
        <UVerticalNavigation :links="worldNavigation" />
      </template>
    </UAccordion>
  </UiPanelContent>
  <UiPanelFooter class="min-h-16">
    <UCheckbox color="cyan" @change="handleDirectiveChange" v-model="showDirectives">
      <template #label>
        <UiBadgesDirective />
      </template>
    </UCheckbox>
  </UiPanelFooter>
</template>

<i18n lang="yaml">
en:
  title: Production
  produce: Stage
  upsert: Backstage
  ensemble: Ensemble
</i18n>
