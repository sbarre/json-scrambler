import { expect, test, describe } from 'vitest';

import scramble from '../dist/index.js';
import { filterOptions } from '../dist/index.js';

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Load JSON files directly
const one = JSON.parse(readFileSync(join(__dirname, 'samples/one.json'), 'utf8'));
const two = JSON.parse(readFileSync(join(__dirname, 'samples/two.json'), 'utf8'));


describe('filterOptions', () => {

  test('removes invalid properties', () => {
    const validOptions = filterOptions({
      chaos: 100,
      canBeNull: 'what',
    });

    expect(validOptions).toEqual({
      chaos: 100
    });
  });

  test('keeps valid properties', () => {
    const validOptions = filterOptions({
      chaos: 50,
      canBeNull: true,
      nullOdds: 10,
    });

    expect(validOptions).toEqual({
      chaos: 50,
      canBeNull: true,
      nullOdds: 10
    });
  });
});

describe('scramble', () => {

  test('returns different data than input', () => {
    const input = one;
    const output = scramble(input, { chaos: 100 });

    expect(output).not.toEqual(input);
  });

  test('maintains structure when not using structure-altering options', () => {
    const input = one;
    const output = scramble(input, { chaos: 100, scrambleValuesOnly: true });

    expect(Object.keys(output)).toEqual(Object.keys(input));
    expect(output.stuff.length).toEqual(input.stuff.length);
  });

  test('respects preservedKeys option for keys but not values', () => {
    const result = scramble(one, {
      chaos: 100,
      preservedKeys: ['name'],
      preserveShape: true
    });
    expect('name' in result).toBe(true);
    expect(typeof result.name).toBe('string');
    expect(result.name).not.toEqual(one.name);
  });

  test('respets chaos option', () => {
    const lowChaosResult = scramble(one, { chaos: 1 });
    const highChaosResult = scramble(one, { chaos: 100 });

    let lowChaosDifferences = 0;
    let highChaosDifferences = 0;

    Object.keys(one).forEach(key => {
      if (one[key] !== lowChaosResult[key]) lowChaosDifferences++;
      if (one[key] !== highChaosResult[key]) highChaosDifferences++;
    });

    expect(highChaosDifferences).toBeGreaterThan(lowChaosDifferences);
  });

  test('handles both string and object inputs', () => {
    const stringInput = JSON.stringify(one);
    const objectResult = scramble(one, { chaos: 100 });
    const stringResult = scramble(stringInput, { chaos: 100 });

    expect(typeof objectResult).toBe('object');
    expect(typeof stringResult).toBe('string');
  });


});
