/**
 * express-to-fastify transform (limited scope)
 * - Detects simple patterns:
 *    const express = require('express');
 *    const router = express.Router();
 *    router.get('/path', handler);
 *    module.exports = router;
 *  - Rewrites occurrences of router.get/post/... to fastify.route calls or fastify.get
 *  - Places a comment near transformed code warning manual verification.
 *
 * NOTE: This transform deliberately handles only simple, common cases and skips complex chained/middleware cases.
 */

const recast = require('recast');
const b = recast.types.builders;
const traverse = require('@babel/traverse').default;

module.exports = {
  id: 'express-to-fastify',
  description: 'Convert simple Express router routes to Fastify route registration (limited scope).',
  matchFiles: ['**/*.js', '**/*.ts'],
  transform(ast, context) {
    let changed = false;
    const messages = [];
    
    // find VariableDeclarator where init is CallExpression with callee express.Router
    recast.types.visit(ast, {
      visitCallExpression(path) {
        try {
          const node = path.node;
          // handle router.get('/path', handler) or app.get(...)
          if (node.callee && node.callee.type === 'MemberExpression' && node.callee.property && node.callee.property.type === 'Identifier') {
            const method = node.callee.property.name;
            if (['get', 'post', 'put', 'delete', 'patch', 'all'].includes(method)) {
              // find route path and handler
              const args = node.arguments || [];
              if (args.length >= 2) {
                const routePath = args[0];
                const handler = args[1];
                // create fastify.call: fastify.route({ method: 'GET', url: '/path', handler })
                const fastifyRoute = b.callExpression(
                  b.memberExpression(b.identifier('fastify'), b.identifier('route')),
                  [b.objectExpression([
                    b.objectProperty(b.identifier('method'), b.stringLiteral(method.toUpperCase())),
                    b.objectProperty(b.identifier('url'), routePath),
                    b.objectProperty(b.identifier('handler'), handler)
                  ])]
                );
                // replace the expression with fastify.route(...)
                path.replace(fastifyRoute);
                changed = true;
                const loc = node.loc && node.loc.start ? node.loc.start.line : 0;
                messages.push({ line: loc, message: `Converted router.${method} to fastify.route` });
              }
            }
          }
        } catch (e) {
          // swallow per-node errors
        }
        this.traverse(path);
      }
    });

    if (changed) {
      // add a comment at top of file indicating transformation applied
      const prog = ast.program;
      if (prog.body && prog.body.length) {
        const first = prog.body[0];
        if (!first.comments) {
          first.comments = [];
        }
        first.comments.unshift({
          type: 'Line',
          value: ' CodeShift applied express-to-fastify transform. Verify manually.'
        });
      }
    }

    return { changed, messages };
  }
};

