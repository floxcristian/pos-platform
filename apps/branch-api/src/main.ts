import 'reflect-metadata';
import { reportStartupFailure, startHttpApplication } from '@pos-platform/backend';
import { createApplication } from './app.js';
import { loadConfig } from './config/runtime-config.js';

Promise.resolve()
  .then(() => startHttpApplication(createApplication, loadConfig(process.env)))
  .catch(() => reportStartupFailure('branch-api'));
