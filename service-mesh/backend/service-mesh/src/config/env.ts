import { z } from 'zod'
import 'dotenv/config'

const schema = z.object({
  NODE_ENV:              z.enum(['development', 'production', 'test']).default('development'),
  PORT:                  z.coerce.number().default(4000),
  HOST:                  z.string().default('0.0.0.0'),
  LOG_LEVEL:             z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  INSTANCE_TTL_SECONDS:  z.coerce.number().default(30),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
