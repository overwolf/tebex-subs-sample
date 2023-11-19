/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  CopyPlugin = require('copy-webpack-plugin');

module.exports = (env) => ({
  entry: {
    index: './src/windows/index.ts',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    clean: true,
    filename: 'windows/[name]/controller.js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, 'public/'),
          from: './',
          to: './',
          globOptions: { ignore: ['**/*.html'] },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './public/windows/index.html',
      filename: path.resolve(__dirname, './dist/windows/index/page.html'),
      chunks: ['index'],
    }),
  ],
});
