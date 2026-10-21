import 'reflect-metadata';
import { reportStartupFailure } from '@pos-platform/backend';
import { runWorkerCommand } from './app.js';
import { loadConfig } from './config/worker-config.js';

Promise.resolve()
  .then(() => runWorkerCommand(process.argv.slice(2), loadConfig(process.env)))
  .then((inspection) => process.stdout.write(JSON.stringify(inspection) + '\n'))
  .catch(() => reportStartupFailure('erp-worker'));
