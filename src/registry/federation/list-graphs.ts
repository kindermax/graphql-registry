import { FastifyInstance, FastifySchema } from 'fastify'
import S from 'fluent-json-schema'

export const schema: FastifySchema = {
  response: {
    '2xx': S.object()
      .additionalProperties(false)
      .required(['success'])
      .prop('success', S.boolean())
      .prop('data', S.array().items(S.string().pattern('[a-zA-Z_\\-0-9]+'))),
  }
}

export default function listGraphs(fastify: FastifyInstance) {
  fastify.get('/graphs', async (req, res) => {
    const allGraphs = await fastify.prisma.graph.findMany()

    res.send({
      success: true,
      data: allGraphs.map((graph) => graph.name),
    })
  })
}
