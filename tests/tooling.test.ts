import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pkg from '../package.json' with { type: 'json' };

const nodeVersion = readFileSync('.node-version', 'utf8').trim();
const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);

describe('tooling', () => {
	test('@types/node major matches .node-version', () => {
		const typesRange = (pkg.devDependencies as Record<string, string>)['@types/node'];
		assert.ok(typesRange, '@types/node must be in devDependencies');
		const typesMajor = parseInt(typesRange.replace(/^[^0-9]*/, ''), 10);
		assert.equal(
			typesMajor,
			nodeMajor,
			`@types/node major (${typesMajor}) does not match .node-version Node major (${nodeMajor}) — run: pnpm add -D @types/node@${nodeMajor}`,
		);
	});
});
