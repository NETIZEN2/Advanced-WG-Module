import { strict as assert } from 'node:assert';
import { Worker } from 'node:worker_threads';

const worker = new Worker(new URL('../services/missionAnalysis.worker.ts', import.meta.url), {
  type: 'module',
  execArgv: [
    '--import', new URL('./worker-shim.js', import.meta.url).href,
    '--loader', new URL('./ts-loader.mjs', import.meta.url).href
  ]
});

const entities = [
  {
    id: 'blue-lib',
    instanceId: 'blue1',
    name: 'Blue Entity',
    force: 'BLUE',
    type: 'AIR',
    icon: 'blue-icon',
    position: [0, 0],
    sensors: [
      { id: 'sensor1', name: 'Radar', type: 'Radar', range: { value: 500, unit: 'km' } }
    ],
    weapons: [
      { id: 'weapon1', name: 'Missile', type: 'Missile', range: { value: 500, unit: 'km' }, probabilityOfHit: 0.8 }
    ],
    systemsState: { weapons: { weapon1: { currentQuantity: 1 } } }
  },
  {
    id: 'red-lib',
    instanceId: 'red1',
    name: 'Red Entity',
    force: 'RED',
    type: 'AIR',
    icon: 'red-icon',
    position: [0, 0],
    sensors: [],
    weapons: [],
    systemsState: { weapons: {} }
  }
];

const disabledSystemIds = new Set();

const response = await new Promise((resolve, reject) => {
  worker.once('message', resolve);
  worker.once('error', reject);
  worker.postMessage({ entities, disabledSystemIds });
});

await worker.terminate();

if (Array.isArray(response)) {
  assert.ok(Array.isArray(response), 'Expected array of mission threads');
} else {
  assert.ok(response && typeof response.error === 'string', 'Expected error object');
}

console.log('mission-analysis worker test passed.');
