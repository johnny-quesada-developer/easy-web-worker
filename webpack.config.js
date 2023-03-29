const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    bundle: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
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
};
