import assert from 'node:assert/strict';

const INSTAGRAM_HANDLE_RE = /^[A-Za-z0-9._]+$/;

export function assertInstagramHandle(value: string, label = 'instagram_handle') {
	assert.equal(typeof value, 'string', `${label} must be a string`);
	assert.ok(value.length > 0, `${label} must not be empty`);
	assert.ok(!value.startsWith('@'), `${label} must not include leading @`);
	assert.match(value, INSTAGRAM_HANDLE_RE, `invalid ${label}: ${value}`);
}
