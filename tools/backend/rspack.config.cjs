const { resolve, basename } = require('node:path');
const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');

/** Official Nx bundling: source libraries stay in the bundle; npm packages stay external. */
function createBackendRspackConfig(appRoot) {
  return {
    // builtin:swc-loader inherits these public targets; it does not read .swcrc.
    target: ['node22', 'es2022'],
    output: {
      path: resolve(appRoot, '../../dist/apps', basename(appRoot)),
      filename: '[name].js',
      library: { type: 'commonjs2' },
      clean: true,
    },
    plugins: [
      new NxAppRspackPlugin({
        target: 'node',
        // Keep NODE_ENV a runtime setting with a versioned Rspack target.
        mode: 'none',
        main: './src/main.ts',
        additionalEntryPoints: [{ entryName: 'application', entryPath: './src/app.ts' }],
        tsConfig: './tsconfig.app.json',
        typeCheckOptions: false,
        externalDependencies: 'all',
        buildLibsFromSource: true,
        generatePackageJson: true,
        runtimeDependencies: ['@fastify/static'],
        generateIndexHtml: false,
        sourceMap: true,
        optimization: false,
        outputHashing: 'none',
        progress: false,
      }),
    ],
  };
}

module.exports = { createBackendRspackConfig };
