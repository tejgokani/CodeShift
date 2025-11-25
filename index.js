/**
 * Library entrypoint for CodeShift
 * Exports:
 *  - runTransforms(paths, options)
 *  - listTransforms()
 */

const engine = require('./lib/engine');
const transforms = require('./lib/transforms');

function listTransforms() {
  return transforms.list();
}

/**
 * paths: array of globs / dirs / files
 * options:
 *   transforms: array of transform ids to run (optional)
 *   apply: boolean (write changes), default false
 *   backup: boolean (create .teleporter.bak), default true
 *   verbose: boolean
 */
async function runTransforms(paths, options = {}) {
  return engine.run(paths, options, transforms.registry);
}

module.exports = { runTransforms, listTransforms };
module.exports.default = module.exports;

