import * as library from 'libxml2-wasm';
import { createDtdValidator } from './dtd-adapter.mjs';
export const validateDtd = createDtdValidator(library);
