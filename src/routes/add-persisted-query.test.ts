import tap from 'tap'
import { addPersistedQuery } from './add-persisted-query'
import { NewNamespace, Request, Response } from '../test-utils'

tap.test('Add Persisted Queries', (t) => {
  t.test('Should store PQ from KV', async (t) => {
    const store = NewNamespace(
      {
        name: 'PERSISTED_QUERIES',
      },
      [],
    )

    const req = Request('POST', '', { key: '123', query: 'query' })
    const res = Response()
    await addPersistedQuery(req, res)
    t.equal(res.statusCode, 200)
    t.same(res.body, {
      success: true,
    })
    t.same(store, [
      {
        key: 'pq::123',
        value: 'query',
      },
    ])
    t.end()
  })
  t.test(
    'Should return validation error because no query was provided',
    async (t) => {
      const store = NewNamespace(
        {
          name: 'PERSISTED_QUERIES',
        },
        [],
      )

      const req = Request('POST', '', { key: '123' })
      const res = Response()
      await addPersistedQuery(req, res)

      t.equal(res.statusCode, 400)
      t.same(res.body, {
        success: false,
        error: 'At path: query -- Expected a string, but received: undefined',
      })
      t.same(store, [])
      t.end()
    },
  )
  t.end()
})
