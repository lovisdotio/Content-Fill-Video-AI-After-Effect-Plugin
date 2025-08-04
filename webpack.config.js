const path = require('path');

module.exports = {
  entry: './src/fal-client-bundled.js',
  output: {
    filename: 'fal-client-bundled.js',
    path: path.resolve(__dirname, 'js'),
    library: 'FalAIClientBundled',
    libraryTarget: 'window'
  },
  mode: 'development',
  target: 'web',
  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "url": false,
      "path": false,
      "os": false,
      "fs": false
    }
  },
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
      }
    ]
  }
};