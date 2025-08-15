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
globalThis.navigator = dom.window.navigator;

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
await new Promise((resolve) => setTimeout(resolve, 0));

const text = container.textContent || '';
assert.ok(text.includes('Analysis engine unavailable.'), 'Fallback message should render');

console.log('worker fallback render test passed.');

