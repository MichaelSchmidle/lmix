<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import { LMiXError } from '@/types/errors'

const { t } = useI18n({ useScope: 'local' })
const client = useSupabaseClient()

const handleSubmit = async (credentials: { email: string; password: string }, node: FormKitNode) => {
  try {
    const { error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error

    await navigateTo('/')
  }
  catch (error) {
    console.error(error)
    node.setErrors([error instanceof LMiXError ? t(error.message) : t('loginFailed')])
  }
}
</script>

<template>
  <UCard>
    <FormKit type="form" :incomplete-message="false" name="credentials" @submit="handleSubmit">
      <FormKit type="email" name="email" :label="t('email.label')" validation="required|email"
        :validation-messages="{ required: t('email.required'), email: t('email.invalid') }" />
      <FormKit type="password" name="password" :label="t('password.label')" validation="required"
        :validation-messages="{ required: t('password.required') }" />
      <template #actions="{ disabled }">
        <UiFormActions>
          <UButton color="cyan" icon="i-ph-sign-in" :label="t('submit')" :loading="(disabled as boolean)" size="lg"
            type="submit" />
        </UiFormActions>
      </template>
    </FormKit>
  </UCard>
</template>

<i18n lang="yaml">
en:
  email:
    label: Email
    required: Email is required.
    invalid: Email is invalid.
  password:
    label: Password
    required: Password is required.
  submit: Sign In
  loginFailed: Login failed.
</i18n>
