import { serverSupabaseClient } from '#supabase/server'
import { CoreSystemMessage, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Database } from '~/types/api'

const systemOpenPrompt = readFileSync(resolve('./prompts/systemOpen.md'), 'utf-8')
const systemClosePrompt = readFileSync(resolve('./prompts/systemClose.md'), 'utf-8')

export default defineLazyEventHandler(async () => {
  return defineEventHandler(async (event: any) => {
    const { messages, production_uuid, assistant_uuid } = await readBody(event)
    const supabase = await serverSupabaseClient<Database>(event)

    // Get the production data
    const { data: production, error: productionError } = await supabase
      .from('productions')
      .select(`
        *,
        world:worlds (*),
        scenario:scenarios (*),
        production_assistants (*,
          assistant:assistants (*,
            persona:personas (*)
          )
        ),
        production_personas (*,
          persona:personas (*)
        ),
        persona_evolutions:production_persona_evolutions (*),
        production_relations (*,
          relation:relations (
            *,
            relation_personas (*,
              persona:personas (*)
            )
          )
        )
      `)
      .eq('uuid', production_uuid)
      .single()

    if (productionError) {
      throw new Error(productionError.message)
    }

    if (!production) {
      throw new Error('Production not found')
    }

    const assistant = production.production_assistants.find(pa => pa.assistant_uuid === assistant_uuid)?.assistant

    if (!assistant) {
      throw new Error('Assistant not found')
    }

    const systemMessages: CoreSystemMessage[] = []

    const systemOpenMessage: CoreSystemMessage = {
      role: 'system',
      content: systemOpenPrompt,
    }

    systemMessages.push(systemOpenMessage)

    // Create a system message with the assistant's persona
    if (assistant.persona) {
      const assistantPersonaSystemMessage: CoreSystemMessage = {
        role: 'system',
        content: [
          '# YOUR PERSONA: ' + assistant.persona.name,
          assistant.persona.self_perception,
          assistant.persona.public_perception,
          assistant.persona.private_knowledge,
          assistant.persona.public_knowledge,
        ].join('\n\n'),
      }

      systemMessages.push(assistantPersonaSystemMessage)
    }

    const systemCloseMessage: CoreSystemMessage = {
      role: 'system',
      content: systemClosePrompt,
    }

    const openai = createOpenAI({
      apiKey: '',
      baseURL: 'http://localhost:1234/v1',
    })

    const result = streamText({
      model: openai('llama-3.2-1b-instruct-uncensored'),
      messages: [...systemMessages, ...messages, systemCloseMessage],
    })

    return result.toDataStreamResponse()
  })
})