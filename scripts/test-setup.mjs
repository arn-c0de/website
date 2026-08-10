/** Registers the module hooks the tests need. See scripts/test-hooks.mjs. */
import { registerHooks } from 'node:module'
import { resolve } from './test-hooks.mjs'

registerHooks({ resolve })
