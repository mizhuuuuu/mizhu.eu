import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertInstagramHandle } from './asserts.js';

const require = createRequire(import.meta.url);
const directedBy = require('../src/data/directed-by-projects.json');
const vfxBy = require('../src/data/vfx-by-projects.json');

const datasets = [
	{ name: 'directed-by-projects', projects: directedBy },
	{ name: 'vfx-by-projects', projects: vfxBy },
];

for (const { name, projects } of datasets) {
	describe(name, () => {
		test('has no duplicate titles', () => {
			const titles = projects.map((p) => p.title);
			const unique = new Set(titles);
			assert.equal(unique.size, titles.length, `Duplicate titles found: ${titles.filter((t, i) => titles.indexOf(t) !== i).join(', ')}`);
		});

		for (const project of projects) {
			describe(project.title, () => {
				test('has required string fields', () => {
					assert.equal(typeof project.title, 'string');
					assert.ok(project.title.length > 0);
					assert.equal(typeof project.thumbnail, 'string');
					assert.ok(project.thumbnail.startsWith('/'));
					assert.equal(typeof project.preview, 'string');
					assert.ok(project.preview.startsWith('/'));
				});

				test('thumbnail and preview files exist under public/', () => {
					assert.ok(existsSync(join('public', project.thumbnail)), `missing thumbnail: ${project.thumbnail}`);
					assert.ok(existsSync(join('public', project.preview)), `missing preview: ${project.preview}`);
				});

				test('year is a number', () => {
					assert.equal(typeof project.year, 'number');
					assert.ok(project.year > 1900 && project.year <= new Date().getFullYear() + 1);
				});

				test('videoUrl is a string or null', () => {
					assert.ok(
						project.videoUrl === null || typeof project.videoUrl === 'string',
						`videoUrl must be a string or null, got: ${typeof project.videoUrl}`,
					);
				});

				test('credits is an array of valid entries', () => {
					assert.ok(Array.isArray(project.credits));
					for (const credit of project.credits) {
						assert.equal(typeof credit.role, 'string', 'credit.role must be a string');
						assert.ok(credit.role.length > 0, 'credit.role must not be empty');
						assert.ok(Array.isArray(credit.names), 'credit.names must be an array');
						assert.ok(credit.names.length > 0, 'credit.names must not be empty');

						const seen = new Set();
						for (const nameEntry of credit.names) {
							const hasName = nameEntry.name !== undefined;
							const hasHandle = nameEntry.instagram_handle !== undefined;
							assert.ok(
								hasName !== hasHandle,
								`entry must have exactly one of "name" or "instagram_handle": ${JSON.stringify(nameEntry)}`,
							);
							if (hasHandle) {
								assertInstagramHandle(nameEntry.instagram_handle);
							} else {
								assert.equal(typeof nameEntry.name, 'string');
								assert.ok(nameEntry.name.length > 0);
							}

							const key = hasHandle ? `@${nameEntry.instagram_handle}` : nameEntry.name;
							assert.ok(!seen.has(key), `duplicate credit entry in "${credit.role}": ${key}`);
							seen.add(key);
						}
					}
				});
			});
		}
	});
}
