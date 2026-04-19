import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertInstagramHandle } from './asserts.ts';
import type { Project } from '../src/types.ts';


function loadFolder(folder: string): Project[] {
	const dir = resolve(import.meta.dirname, '..', 'src', 'data', folder);
	return readdirSync(dir)
		.filter((f) => f.endsWith('.json'))
		.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Project);
}

for (const folder of ['directed-by', 'vfx'] as const) {
	describe(folder, () => {
		for (const project of loadFolder(folder)) {
			describe(project.title, () => {
				test('has required string fields', () => {
					assert.equal(typeof project.title, 'string');
					assert.ok(project.title.length > 0);
					assert.equal(typeof project.thumbnail, 'string');
					assert.ok(project.thumbnail.startsWith('/'));
					assert.equal(typeof project.preview, 'string');
					assert.ok(project.preview.startsWith('/'));
				});

				test('thumbnail exists in public/', () => {
					assert.ok(existsSync(join('public', project.thumbnail)), `missing thumbnail: ${project.thumbnail}`);
				});

				test('preview exists in public/', () => {
					assert.ok(existsSync(join('public', project.preview)), `missing preview: ${project.preview}`);
				});

				test('year is a number', () => {
					assert.equal(typeof project.year, 'number');
					assert.ok(project.year >= 2020 && project.year <= 2050);
				});

				test('order is an integer', () => {
					assert.equal(typeof project.order, 'number');
					assert.ok(Number.isInteger(project.order));
				});

				test('videoUrl is absent, empty, or https URL', () => {
					if (!project.videoUrl) return;
					assert.equal(typeof project.videoUrl, 'string');
					assert.ok(project.videoUrl.startsWith('https://'), `videoUrl must start with https://, got: ${project.videoUrl}`);
				});

				test('credits is an array of valid entries', () => {
					assert.ok(Array.isArray(project.credits));
					assert.ok(project.credits.length >= 1 && project.credits.length <= 100, `credits count out of range: ${project.credits.length}`);
					for (const credit of project.credits) {
						assert.equal(typeof credit.role, 'string', 'credit.role must be a string');
						assert.ok(credit.role.length > 0, 'credit.role must not be empty');
						assert.ok(Array.isArray(credit.names), 'credit.names must be an array');
						assert.ok(credit.names.length >= 1 && credit.names.length <= 100, `names count out of range: ${credit.names.length}`);

						for (const nameEntry of credit.names) {
							if (typeof nameEntry.instagram_handle === 'string' && nameEntry.instagram_handle.length > 0) {
								assertInstagramHandle(nameEntry.instagram_handle);
							}
						}
					}
				});
			});
		}
	});
}
