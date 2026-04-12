import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pkg from '../package.json' with { type: 'json' };

const nvmrc = readFileSync('.nvmrc', 'utf8').trim();
const nvmrcMajor = parseInt(nvmrc.split('.')[0], 10);

describe('tooling', () => {
	test('@types/node major matches .nvmrc', () => {
		const typesRange = (pkg.devDependencies as Record<string, string>)['@types/node'];
		assert.ok(typesRange, '@types/node must be in devDependencies');
		const typesMajor = parseInt(typesRange.replace(/^[^0-9]*/, ''), 10);
		assert.equal(
			typesMajor,
			nvmrcMajor,
			`@types/node major (${typesMajor}) does not match .nvmrc Node major (${nvmrcMajor}) — run: pnpm add -D @types/node@${nvmrcMajor}`,
		);
	});
});
