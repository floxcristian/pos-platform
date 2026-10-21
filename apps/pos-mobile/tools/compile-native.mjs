import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const [platform, ...extra] = process.argv.slice(2);
if (extra.length > 0 || !['android', 'ios'].includes(platform)) {
  throw new Error('Specify exactly one native build target: android or ios.');
}
if (platform === 'ios' && process.platform !== 'darwin') {
  throw new Error('The iOS simulator build requires macOS with Xcode 26 or newer.');
}

const command =
  platform === 'android' ? (process.platform === 'win32' ? 'gradlew.bat' : './gradlew') : 'xcodebuild';
const args =
  platform === 'android'
    ? [':app:assembleRelease', '--no-daemon']
    : [
        '-project',
        'App.xcodeproj',
        '-scheme',
        'App',
        '-configuration',
        'Debug',
        '-sdk',
        'iphonesimulator',
        '-destination',
        'generic/platform=iOS Simulator',
        '-derivedDataPath',
        resolve(appRoot, '../../dist/apps/pos-mobile/ios'),
        'CODE_SIGNING_ALLOWED=NO',
        'CODE_SIGNING_REQUIRED=NO',
        'build',
      ];
const child = spawn(command, args, {
  cwd: resolve(appRoot, platform === 'android' ? 'android' : 'ios/App'),
  stdio: 'inherit',
  // Windows executes the generated Gradle batch launcher. Both command and
  // arguments above are fixed by this script, never interpolated user input.
  shell: platform === 'android' && process.platform === 'win32',
});
child.on('error', (error) => {
  process.stderr.write(`Native build could not start: ${error.message}\n`);
  process.exitCode = 1;
});
child.on('close', (code) => {
  process.exitCode = code ?? 1;
});
