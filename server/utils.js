import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function __dirname(importMetaUrl) {
  const filename = fileURLToPath(importMetaUrl);
  return dirname(filename);
}
