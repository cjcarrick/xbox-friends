/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const { ESBuildMinifyPlugin } = require('esbuild-loader')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: [path.join(__dirname, 'ts', 'index.ts'), path.join(__dirname, 'scss', 'style.scss')],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js'
  },
  externals: require('webpack-node-externals')(),
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        exclude: /node_modules/,
        options: {
          loader: 'ts',
          target: 'es6'
        }
      },
      {
        test: /.pug/,
        exclude: /node_modules/,
        use: ['pug-loader']
      },
      {
        test: /\.s[ac]ss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader',
            options: { outputPath: 'static/', name: '[name].css' }
          },
          'sass-loader'
        ]
      }
    ]
  },
  devtool: process.env.NODE_ENV == 'development' ? 'inline-source-map' : false,
  plugins: [new CopyPlugin({ patterns: [{ from: './assets/', to: './static/' }] })],
  optimization: {
    minimizer: [new ESBuildMinifyPlugin({ target: 'es2021', drop: ['console'] })]
  }
}
