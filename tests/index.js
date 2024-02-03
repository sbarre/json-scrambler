import t from 'tap';
import sinon from 'sinon';

import { inspect } from 'util';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import mutate from '../dist/index.js';

const one = require('./samples/one.json');
const two = require('./samples/two.json');

t.test('mutate', async (t) => {

  t.ok();

  t.end();
});