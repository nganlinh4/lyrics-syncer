const { override, addBabelPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add Babel plugins for optional chaining and nullish coalescing operators
  config = addBabelPlugin('@babel/plugin-transform-optional-chaining')(config);
  config = addBabelPlugin('@babel/plugin-transform-nullish-coalescing-operator')(config);

  // Add EnvironmentPlugin to inject environment variables
  config.plugins = [
    ...config.plugins,
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      REACT_APP_API_URL: 'http://localhost:3001'
    })
  ];

  return config;
};