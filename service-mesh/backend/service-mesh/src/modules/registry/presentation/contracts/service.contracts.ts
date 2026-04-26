import { z } from 'zod'
import type { RouteContract } from './route-contract.js'

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const ServiceSchemas = {
  CreateBody: z.object({
    name:   z.string().min(1).max(128),
    labels: z.record(z.string()).optional(),
  }),

  ServiceIdParam: z.object({
    serviceId: z.string().uuid(),
  }),

  ListQuery: z.object({
    name:   z.string().optional(),
    labels: z.string().optional(),
  }),

  VersionQuery: z.object({
    version: z.string().optional(),
  }),

  ServiceDto: z.object({
    id:        z.string().uuid(),
    name:      z.string(),
    labels:    z.record(z.string()),
    createdAt: z.string().datetime(),
    instances: z.array(z.any()),
  }),

  VersionsDto: z.object({
    serviceId:   z.string().uuid(),
    serviceName: z.string(),
    versions:    z.array(z.any()),
  }),
} as const

export type CreateServiceBody = z.infer<typeof ServiceSchemas.CreateBody>
export type ServiceIdParam    = z.infer<typeof ServiceSchemas.ServiceIdParam>
export type ListServicesQuery = z.infer<typeof ServiceSchemas.ListQuery>

// ---------------------------------------------------------------------------
// Named contracts — living API documentation
// ---------------------------------------------------------------------------

export const CreateServiceContract = {
  method:   'POST',
  path:     '/services',
  summary:  'Register a new service in the registry',
  tags:     ['Services'],
  body:     ServiceSchemas.CreateBody,
  response: ServiceSchemas.ServiceDto,
} satisfies RouteContract

export const ListServicesContract = {
  method:   'GET',
  path:     '/services',
  summary:  'List all registered services with optional filters',
  tags:     ['Services'],
  query:    ServiceSchemas.ListQuery,
  response: z.array(ServiceSchemas.ServiceDto),
} satisfies RouteContract

export const GetServiceContract = {
  method:   'GET',
  path:     '/services/:serviceId',
  summary:  'Get a service by ID',
  tags:     ['Services'],
  params:   ServiceSchemas.ServiceIdParam,
  response: ServiceSchemas.ServiceDto,
} satisfies RouteContract

export const DeleteServiceContract = {
  method:   'DELETE',
  path:     '/services/:serviceId',
  summary:  'Delete a service and all its instances',
  tags:     ['Services'],
  params:   ServiceSchemas.ServiceIdParam,
  response: z.void(),
} satisfies RouteContract

export const GetServiceVersionsContract = {
  method:   'GET',
  path:     '/services/:serviceId/versions',
  summary:  'Get versions grouped by metadata.version field',
  tags:     ['Services'],
  params:   ServiceSchemas.ServiceIdParam,
  response: ServiceSchemas.VersionsDto,
} satisfies RouteContract

export const GetServiceOpenApiContract = {
  method:   'GET',
  path:     '/services/:serviceId/openapi',
  summary:  'Proxy OpenAPI spec from a healthy instance of the service',
  tags:     ['Services'],
  params:   ServiceSchemas.ServiceIdParam,
  query:    ServiceSchemas.VersionQuery,
  response: z.any(),
} satisfies RouteContract
