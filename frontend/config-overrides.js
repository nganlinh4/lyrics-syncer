const { override, addBabelPlugin } = require('customize-cra');

module.exports = override(
  // Add Babel plugins for optional chaining and nullish coalescing operators
  addBabelPlugin('@babel/plugin-transform-optional-chaining'),
  addBabelPlugin('@babel/plugin-transform-nullish-coalescing-operator')
);