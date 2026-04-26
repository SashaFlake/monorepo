import { z } from 'zod'
import type { EndpointContract } from '../../../../shared/route-contract.js'

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const InstanceSchemas = {
  RegisterBody: z.object({
    serviceId:  z.string().uuid(),
    host:       z.string().min(1),
    port:       z.number().int().min(1).max(65535),
    healthPath: z.string().startsWith('/').optional(),
    metadata:   z.record(z.string()).optional(),
  }),

  InstanceIdParam: z.object({
    instanceId: z.string().uuid(),
  }),

  InstanceDto: z.object({
    id:         z.string().uuid(),
    serviceId:  z.string().uuid(),
    host:       z.string(),
    port:       z.number(),
    status:     z.string(),
    metadata:   z.record(z.string()),
    registeredAt: z.string().datetime(),
    lastHeartbeatAt: z.string().datetime().nullable(),
  }),
} as const

export type RegisterInstanceBody = z.infer<typeof InstanceSchemas.RegisterBody>
export type InstanceIdParam      = z.infer<typeof InstanceSchemas.InstanceIdParam>

// ---------------------------------------------------------------------------
// Named contracts
// ---------------------------------------------------------------------------

export const RegisterInstanceContract = {
  method:   'POST',
  path:     '/instances',
  summary:  'Register a new service instance',
  tags:     ['Instances'],
  body:     InstanceSchemas.RegisterBody,
  response: InstanceSchemas.InstanceDto,
} satisfies EndpointContract

export const HeartbeatContract = {
  method:   'PUT',
  path:     '/instances/:instanceId/heartbeat',
  summary:  'Send a heartbeat for a registered instance',
  tags:     ['Instances'],
  params:   InstanceSchemas.InstanceIdParam,
  response: z.void(),
} satisfies EndpointContract

export const DeregisterInstanceContract = {
  method:   'DELETE',
  path:     '/instances/:instanceId',
  summary:  'Deregister an instance from the registry',
  tags:     ['Instances'],
  params:   InstanceSchemas.InstanceIdParam,
  response: z.void(),
} satisfies EndpointContract
