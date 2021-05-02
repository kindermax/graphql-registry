import S from 'fluent-json-schema'
import { FastifyInstance, FastifySchema } from 'fastify'
import { diff } from '@graphql-inspector/core'
import { composeAndValidateSchema } from '../../core/federation'
import { SchemaService } from '../../core/services/Schema'
import { InvalidGraphNameError, SchemaCompositionError, SchemaVersionLookupError } from '../../core/errrors'
export interface RequestContext {
  Body: {
    service_name: string
    type_defs: string
    graph_name: string
  }
}

export const schema: FastifySchema = {
  body: S.object()
    .additionalProperties(false)
    .required(['type_defs', 'service_name', 'graph_name'])
    .prop('graph_name', S.string().minLength(1).pattern('[a-zA-Z_\\-0-9]+'))
    .prop('type_defs', S.string().minLength(1).maxLength(10000))
    .prop('service_name', S.string().minLength(1).pattern('[a-zA-Z_\\-0-9]+')),
}

export default function getSchemaDiff(fastify: FastifyInstance) {
  fastify.post<RequestContext>('/schema/diff', { schema }, async (req, res) => {
    const graph = await fastify.prisma.graph.findFirst({
      where: {
        name: req.body.graph_name,
        isActive: true,
      },
    })
    if (!graph) {
      throw InvalidGraphNameError(req.body.graph_name)
    }

    const serviceModels = await fastify.prisma.service.findMany({
      select: {
        name: true,
      },
    })
    const allServiceNames = serviceModels.map((s) => s.name)

    if (!allServiceNames.length) {
      return res.send({
        success: true,
        data: [],
      })
    }

    const allServiceVersions = allServiceNames.map((s) => ({
      name: s,
    }))

    const schmemaService = new SchemaService(fastify.prisma)
    const { schemas, error: findError } = await schmemaService.findByServiceVersions(
      req.body.graph_name,
      allServiceVersions,
    )

    if (findError) {
      throw SchemaVersionLookupError(findError.message)
    }

    let serviceSchemas = schemas.map((s) => ({
      name: s.serviceName,
      typeDefs: s.typeDefs,
    }))

    let original = composeAndValidateSchema(serviceSchemas)
    if (!original.schema) {
      throw SchemaCompositionError(original.error)
    }

    if (original.error) {
      throw SchemaCompositionError(original.error)
    }

    serviceSchemas = serviceSchemas
      .filter((schema) => schema.name !== req.body.service_name)
      .concat({
        name: req.body.service_name,
        typeDefs: req.body.type_defs,
      })

    const updated = composeAndValidateSchema(serviceSchemas)
    if (!updated.schema) {
      throw SchemaCompositionError(updated.error)
    }
    if (updated.error) {
      throw SchemaCompositionError(updated.error)
    }

    const result = diff(original.schema, updated.schema)

    return {
      success: true,
      data: result,
    }
  })
}
