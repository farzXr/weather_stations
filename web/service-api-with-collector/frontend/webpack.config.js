const path = require('path');
const webpack = require('webpack');  
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

module.exports = {
  entry: {
    index: './src/js/pages/index-script.js',
    station: './src/js/pages/station-script.js',
    edit: './src/js/pages/edit-script.js',
    create: './src/js/pages/create-script.js',
  },
  output: {
    filename: 'js/[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/static/dist/'
  },
  mode: 'production',
  
  plugins: [
    new webpack.DefinePlugin({
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'http://localhost:8080/api/v1'),
      'process.env.APP_BASE_URL': JSON.stringify(process.env.APP_BASE_URL || 'http://localhost:8080'),
      'process.env.TIMEZONE_OFFSET': JSON.stringify(process.env.TIMEZONE_OFFSET || 4)
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new WebpackManifestPlugin({
      fileName: 'manifest.json',
      publicPath: '/static/dist/'
    })
  ],
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  }
};