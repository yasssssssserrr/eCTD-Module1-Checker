// This external import resolves beside the compiled worker in dist/.
import * as library from './vendor/libxml2/index.mjs';
import { createDtdValidator } from './dtd-adapter.mjs';
import { runValidation } from './engine.mjs';
import { createDemoEntries } from './demo.mjs';

self.onmessage = async ({ data }) => {
  try {
    const files = data.demo ? createDemoEntries() : data.files;
    const report = await runValidation(files, {
      sequence: data.sequence, inputKind: data.demo ? 'synthetic-demo' : 'user-selected',
      environment: { userAgent: self.navigator.userAgent },
      onProgress: progress => self.postMessage({ type: 'progress', progress }),
      validateDtd: createDtdValidator(library),
    });
    self.postMessage({ type: 'result', report });
  } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
};
self.postMessage({ type:'ready' });
