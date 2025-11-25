/**
 * transforms/index.js - registry of all transforms
 */

const expressToFastify = require('./express-to-fastify');
const cjsToEsm = require('./cjs-to-esm');
const mongooseToPrisma = require('./mongoose-to-prisma');

const registry = {
  'express-to-fastify': expressToFastify,
  'cjs-to-esm': cjsToEsm,
  'mongoose-to-prisma': mongooseToPrisma
};

function list() {
  return Object.values(registry).map(t => ({
    id: t.id,
    description: t.description
  }));
}

module.exports = { registry, list };

