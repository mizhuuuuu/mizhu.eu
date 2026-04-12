import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { assertInstagramHandle } from './asserts.js';

const require = createRequire(import.meta.url);
const contact = require('../src/data/contact.json');

describe('contact', () => {
	test('email is a valid-looking address', () => {
		assert.equal(typeof contact.email, 'string');
		assert.match(contact.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
	});

	test('instagram_handle is a valid handle', () => {
		assertInstagramHandle(contact.instagram_handle);
	});
});
