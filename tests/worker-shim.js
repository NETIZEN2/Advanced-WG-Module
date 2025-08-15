import { parentPort } from 'node:worker_threads';

globalThis.self = globalThis;
globalThis.addEventListener = (type, listener) => {
  if (type === 'message') parentPort.on('message', (data) => listener({ data }));
};

globalThis.postMessage = (data) => {
  parentPort.postMessage(data);
};
