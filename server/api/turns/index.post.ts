import { readFileSync } from 'fs'
import { resolve } from 'path'
import OpenAI from 'openai'
import { zodResponseFormat } from "openai/helpers/zod"
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { z } from 'zod'
import { LMiXError } from '~/types/errors'
import { modelResponseSchema } from '~/types/model'

// Request body schema
const requestSchema = z.object({
  api: z.object({
    endpoint: z.string(),
    key: z.string().nullable(),
  }),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function', 'tool']),
    content: z.string(),
    name: z.string().optional(),
    function_call: z.unknown().optional(),
    tool_calls: z.unknown().optional(),
  })),
  model: z.string(),
})

const systemOpenPrompt = readFileSync(resolve('./prompts/systemOpen.md'), 'utf-8')
const systemClosePrompt = readFileSync(resolve('./prompts/systemClose.md'), 'utf-8')

export default defineLazyEventHandler(async () => {
  return defineEventHandler(async (event) => {
    try {
      // Validate request body
      const body = await readBody(event)
      const result = requestSchema.safeParse(body)

      if (!result.success) {
        throw new LMiXError(
          'Invalid request body',
          'VALIDATION_ERROR',
          result.error.errors
        )
      }

      // Set up OpenAI client
      const openai = new OpenAI({
        apiKey: result.data.api.key || '',
        baseURL: result.data.api.endpoint,
      })

      // Set up proper streaming response headers
      setHeader(event, 'Content-Type', 'text/event-stream')
      setHeader(event, 'Cache-Control', 'no-cache')
      setHeader(event, 'Connection', 'keep-alive')

      try {
        const stream = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: systemOpenPrompt,
            },
            ...result.data.messages,
            {
              role: 'system',
              content: systemClosePrompt,
            },
          ] as ChatCompletionMessageParam[],
          model: result.data.model,
          response_format: zodResponseFormat(modelResponseSchema, 'response'),
          stream: true,
        })

        // Convert to ReadableStream
        return new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || ''
                if (content) {
                  if (import.meta.dev) {
                    console.debug('Stream chunk:', content)
                  }
                  controller.enqueue(new TextEncoder().encode(content))
                }
              }
              // Stream complete
              controller.close()
            }
            catch (error) {
              const streamError = new LMiXError(
                'Failed to process stream chunk',
                'STREAM_ERROR',
                error
              )
              if (import.meta.dev) {
                console.error('Streaming error:', streamError)
              }
              controller.error(streamError)
            }
          }
        })
      }
      catch (error) {
        throw new LMiXError(
          'Failed to create chat completion',
          'API_ERROR',
          error
        )
      }
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('API error:', error)
      }

      if (error instanceof LMiXError) {
        throw createError({
          statusCode: error.code === 'VALIDATION_ERROR' ? 400 : 500,
          message: error.message,
          data: import.meta.dev ? error.details : undefined
        })
      }

      throw createError({
        statusCode: 500,
        message: 'Internal server error',
        data: import.meta.dev ? error : undefined
      })
    }
  })
})