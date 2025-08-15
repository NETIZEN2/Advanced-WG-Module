import { strict as assert } from 'node:assert';
import fs from 'node:fs';

assert.ok(fs.existsSync('index.css'), 'index.css should exist');
const css = fs.readFileSync('index.css', 'utf8');
assert.ok(css.trim().length > 0, 'index.css should not be empty');

const html = fs.readFileSync('index.html', 'utf8');
assert.ok(/<link rel="stylesheet" href="\.?\/index.css">/.test(html), 'index.html should reference index.css');

console.log('index.css link and content test passed.');
