import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assertInstagramHandle } from './asserts.ts';
import contact from '../src/data/contact.json' with { type: 'json' };

describe('contact', () => {
	test('email is a valid-looking address', () => {
		assert.equal(typeof contact.email, 'string');
		assert.match(contact.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
	});

	test('instagram_handle is a valid handle', () => {
		assertInstagramHandle(contact.instagram_handle);
	});
});
