import { strict as assert } from 'node:assert';
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';

// Setup a DOM environment
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/'
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// Make Worker throw during construction
globalThis.Worker = class {
  constructor() {
    throw new Error('fail');
  }
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App));

// Allow effects to run
await new Promise((resolve) => setTimeout(resolve, 10));

const text = container.textContent || '';
assert.ok(text.length > 0, 'App should render some content when worker creation fails');
assert.ok(document.querySelector('main'), 'App main content should be present');

console.log('worker fallback render test passed.');

