import { strict as assert } from 'node:assert';
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';

// Setup a DOM environment
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/'
});

globalThis.window = dom.window as any;
globalThis.document = dom.window.document as any;
globalThis.navigator = dom.window.navigator as any;

// Make Worker throw during construction to avoid real worker usage
// and trigger fallback rendering path
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.Worker = class { constructor() { throw new Error('fail'); } };

const container = document.getElementById('root');
assert.ok(container, 'root container should exist');
const root = createRoot(container!);
root.render(<App />);

// Allow effects to run
await new Promise((resolve) => setTimeout(resolve, 0));

assert.ok(document.querySelector('aside'), '<App /> should render an aside element');
assert.ok(document.querySelector('main'), '<App /> should render a main element');

console.log('app render test passed.');
