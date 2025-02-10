const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    bundle: './src/index.ts',
    createBlobWorker: './src/createBlobWorker.ts',
    createEasyWebWorker: './src/createEasyWebWorker.ts',
    createStaticEasyWebWorker: './src/createStaticEasyWebWorker.ts',
    EasyWebWorker: './src/EasyWebWorker.ts',
    EasyWebWorkerMessage: './src/EasyWebWorkerMessage.ts',
    getWorkerTemplate: './src/getWorkerTemplate.ts',
    StaticEasyWebWorker: './src/StaticEasyWebWorker.ts',
    types: './src/types.ts',
    uniqueId: './src/uniqueId.ts',
  },
  output: {
    path: path.resolve(__dirname),
    filename: ({ chunk: { name } }) => {
      if (name.includes('worker')) {
        return `${name}.worker.js`;
      }

      return `${name}.js`;
    },
    libraryTarget: 'umd',
    library: 'easy-web-worker',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'easy-web-worker': path.resolve(
        __dirname,
        'node_modules/easy-web-worker/package.json'
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript'],
              plugins: [
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-export-namespace-from',
              ],
            },
          },
          {
            loader: 'ts-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
