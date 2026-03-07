import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const directedBy = require('../src/data/directed-by-projects.json');
const vfxBy = require('../src/data/vfx-by-projects.json');

const publicDir = resolve(import.meta.dirname, '../public');

const datasets = [
	{ name: 'directed-by-projects', projects: directedBy },
	{ name: 'vfx-by-projects', projects: vfxBy },
];

for (const { name, projects } of datasets) {
	describe(name, () => {
		for (const project of projects) {
			describe(project.title, () => {
				test('thumbnail exists in public/', () => {
					const file = join(publicDir, project.thumbnail);
					assert.ok(existsSync(file), `Missing thumbnail: ${project.thumbnail}`);
				});

				test('preview exists in public/', () => {
					const file = join(publicDir, project.preview);
					assert.ok(existsSync(file), `Missing preview: ${project.preview}`);
				});
			});
		}
	});
}
