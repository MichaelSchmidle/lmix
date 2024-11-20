<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { World, WorldInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const user = useSupabaseUser()
const worldStore = useWorldStore()

const props = defineProps({
  world: {
    type: Object as PropType<World>,
    default: undefined,
  },
})

const isUpdate = computed(() => !!props.world)

const handleSubmit = async (form: Partial<WorldInsert>, node: FormKitNode) => {
  try {
    const uuid = await worldStore.upsertWorld({
      ...form,
      uuid: props.world?.uuid,
      user_uuid: user.value!.id,
    } as WorldInsert)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'worldUpdated' : 'worldCreated'),
    })

    navigateTo(`/worlds/${uuid}`)
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('saveFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-planet-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleCreate')" :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionCreate')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="world">
        <FormKit type="text" name="name" :label="t('name.label')" validation="required" :validation-messages="{ required: t('name.required') }" />
        <FormKit type="textarea" auto-height name="description" :label="t('description.label')" />
        <template #actions>
          <UiFormActions>
            <WorldsDeleteModal v-if="world" :world="world" @success="navigateTo('/worlds/add')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'" :label="t(isUpdate ? 'updateWorld' : 'createWorld')" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    titleCreate: Create World
    titleUpdate: Update
    descriptionCreate: Create a new world to define the stage for your interactions.
    descriptionUpdate: Update this world’s configuration.
    name:
      label: Name
      placeholder: Enter world name…
      required: Name is required
    description:
      label: Description
      placeholder: Enter world description…
      required: Description is required
    createWorld: Create World
    updateWorld: Update
    worldCreated: World created.
    worldUpdated: World updated.
    saveFailed: Failed to save world.
</i18n>