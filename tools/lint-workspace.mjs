import { createProjectGraphAsync } from '@nx/devkit';
import { ESLint } from 'eslint';

// The Nx rule needs a graph even on the first lint in a fresh checkout.
await createProjectGraphAsync({ exitOnError: false });
const eslint = new ESLint();
const results = await eslint.lintFiles(['apps', 'libs', 'tools/eslint/**/*.spec.ts']);
const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);
if (output) process.stdout.write(output);
process.exitCode = results.some((result) => result.errorCount || result.warningCount) ? 1 : 0;
