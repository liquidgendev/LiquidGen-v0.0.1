const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const tailwindPostcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  // Force CRACO's postcss plugin list so PostCSS uses the adapter plugin
  style: {
    postcss: {
      plugins: [
        tailwindPostcss,
        autoprefixer,
      ],
    },
  },

  webpack: {
    configure: (webpackConfig) => {
      // Add Node polyfills via plugin (covers crypto, stream, etc.)
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new NodePolyfillPlugin(),
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ]);

      // Ensure some fallbacks are present
      webpackConfig.resolve.fallback = Object.assign({}, webpackConfig.resolve.fallback, {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
      });

      // Add explicit alias for imports that request "process/browser"
      webpackConfig.resolve.alias = Object.assign({}, webpackConfig.resolve.alias, {
        'process/browser': require.resolve('process/browser.js'),
      });

      return webpackConfig;
    },
  },
};
