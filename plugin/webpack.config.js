const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',
  output: {
    filename: 'main.js',
    // Output to the plugin root so UXP can resolve main.js relative to manifest.json
    path: path.resolve(__dirname),
  },
  target: 'web',
  // 'commonjs photoshop' tells webpack to emit require('photoshop') in the bundle,
  // matching how UXP's module system provides these — NOT browser globals.
  externals: {
    photoshop: 'commonjs photoshop',
    uxp: 'commonjs uxp',
  },
  resolve: {
    extensions: ['.jsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      // CSS is inlined in src/index.html — no CSS loader needed for UXP
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      // UXP runs scripts before body is parsed regardless of placement or defer.
      // index.jsx handles this with a DOMContentLoaded fallback.
      scriptLoading: 'blocking',
    }),
  ],
};
