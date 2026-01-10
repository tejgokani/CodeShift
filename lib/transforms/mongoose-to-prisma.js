/**
 * mongoose-to-prisma transform (very limited scope)
 * - Replace common patterns:
 *   Model.find(query)    -> prisma.model.findMany({ where: query })
 *   Model.findOne(query) -> prisma.model.findFirst({ where: query })
 *   instance.save()      -> prisma.model.create/update...
 * - Adds a comment near change reminding manual verification.
 * - This is intentionally conservative and only handles simple MemberExpression calls.
 */

const recast = require('recast');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

module.exports = {
  id: 'mongoose-to-prisma',
  description: 'Convert simple Mongoose Model.find/findOne/save patterns into Prisma-like calls (limited & opinionated).',
  matchFiles: ['**/*.js', '**/*.ts'],
  transform(ast, context) {
    let changed = false;
    const messages = [];

    traverse(ast, {
      CallExpression(path) {
        try {
          const callee = path.node.callee;
          // detect Model.find(...) where callee is MemberExpression with .find
          if (callee && callee.type === 'MemberExpression' && callee.property && (callee.property.name === 'find' || callee.property.name === 'findOne')) {
            // Check if object is an Identifier (e.g., User.find)
            if (callee.object && callee.object.type === 'Identifier') {
              const modelId = callee.object.name; // e.g., User
              const method = callee.property.name; // find or findOne
              const args = path.node.arguments || [];
              const query = args[0] || t.objectExpression([]);

              // Save location before replacing
              const loc = path.node.loc && path.node.loc.start ? path.node.loc.start.line : 0;

              // construct prisma call: prisma.user.findMany({ where: <query> })
              // build MemberExpression like prisma.user.findMany
              const member = t.memberExpression(
                t.memberExpression(t.identifier('prisma'), t.identifier(modelId.toLowerCase())),
                t.identifier(method === 'find' ? 'findMany' : 'findFirst')
              );
              const callExp = t.callExpression(member, [t.objectExpression([t.objectProperty(t.identifier('where'), query)])]);

              // replace node (Babel traverse uses replaceWith, not replace)
              path.replaceWith(callExp);
              changed = true;
              messages.push({ line: loc, message: `Converted ${modelId}.${method} to prisma.${modelId.toLowerCase()}.${method === 'find' ? 'findMany' : 'findFirst'}` });
            }
          }
          // detect instance.save() -> comment (complex to auto-convert)
          if (callee && callee.type === 'MemberExpression' && callee.property && callee.property.name === 'save') {
            const loc = path.node.loc && path.node.loc.start ? path.node.loc.start.line : 0;
            messages.push({ line: loc, message: 'Found instance.save() — manual conversion to prisma.create/update likely required. Skipping automatic rewrite.' });
          }
        } catch (e) {
          // Log error for debugging but don't fail the transform
          if (context.options && context.options.verbose) {
            console.error('Transform error:', e);
          }
        }
      }
    });

    if (changed) {
      // add top-of-file comment
      const prog = ast.program;
      const first = prog.body[0];
      if (first) {
        if (!first.comments) {
          first.comments = [];
        }
        first.comments.unshift({
          type: 'Line',
          value: ' CodeShift applied mongoose-to-prisma transform. Verify and adjust imports (prisma client) manually.'
        });
      }
    }

    return { changed, messages };
  }
};

