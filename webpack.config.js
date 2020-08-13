const path = require('path');

module.exports = {
  mode: 'production',
  entry: './dist/lib/index.js',
  output: {
    filename: 'matrix-cypher.js',
    path: path.resolve(__dirname, 'web'),
    library: 'MatrixCypher',
  },
  node: {
    fs: 'empty',
  },
};
