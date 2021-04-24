import { Router, compose } from 'worktop'
import { listen } from 'worktop/cache'
import { ScheduledEvent } from './types'
import { basicAuth } from './middlewares/basic-auth'
import { addPersistedQuery } from './routes/add-persisted-query'
import { getComposedSchema } from './routes/get-composed-schema'
import { getComposedSchemaByVersions } from './routes/get-composed-schema-versions'
import { getPersistedQuery } from './routes/get-persisted-query'
import { getSchemaDiff } from './routes/get-schema-diff'
import { getSchemaValidation } from './routes/get-schema-validation'
import { registerSchema } from './routes/register-schema'
import { deletePersistedQuery } from './routes/delete-persisted-query'
import { healthcheck } from './routes/healthcheck'
import { deactivateSchema } from './routes/deactivate-schema'

const API = new Router()

API.add('GET', '/health', healthcheck)

// Federation
API.add('POST', '/schema/push', compose(basicAuth, registerSchema))
API.add('GET', '/schema/latest', compose(basicAuth, getComposedSchema))
API.add('PUT', '/schema/deactivate', compose(basicAuth, deactivateSchema))
API.add(
  'POST',
  '/schema/compose',
  compose(basicAuth, getComposedSchemaByVersions),
)

// Tooling
API.add('POST', '/schema/validate', compose(basicAuth, getSchemaValidation))
API.add('POST', '/schema/diff', compose(basicAuth, getSchemaDiff))

// Persisted queries
API.add('POST', '/persisted_query', compose(basicAuth, addPersistedQuery))
API.add('GET', '/persisted_query', compose(basicAuth, getPersistedQuery))
API.add('DELETE', '/persisted_query', compose(basicAuth, deletePersistedQuery))

listen(API.run)
