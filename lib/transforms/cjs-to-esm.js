/**
 * cjs-to-esm transform (limited)
 * - Converts simple require() to import and module.exports to export default
 * - Only operates on modules that do not contain import/export already (pure CJS files)
 * - For safety, does not rewrite mixed modules; reports them.
 */

const recast = require('recast');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

module.exports = {
  id: 'cjs-to-esm',
  description: 'Convert simple CommonJS require/module.exports patterns into ESM import/export (limited cases).',
  matchFiles: ['**/*.js', '**/*.ts'],
  transform(ast, context) {
    let changed = false;
    const messages = [];

    // Detect whether AST already contains ImportDeclaration or ExportDeclaration
    let hasESM = false;
    traverse(ast, {
      ImportDeclaration() { hasESM = true; this.stop(); },
      ExportNamedDeclaration() { hasESM = true; this.stop(); },
      ExportDefaultDeclaration() { hasESM = true; this.stop(); }
    });

    if (hasESM) {
      messages.push({ line: 0, message: 'Contains existing ESM imports/exports; skipping to avoid mixed module issues.' });
      return { changed: false, messages };
    }

    // Convert simple const x = require('mod') to ImportDeclaration
    const body = ast.program.body;
    const newBody = [];
    for (const node of body) {
      if (node.type === 'VariableDeclaration') {
        const decl = node.declarations && node.declarations[0];
        if (decl && decl.init && decl.init.type === 'CallExpression' && decl.init.callee.name === 'require'
            && decl.init.arguments && decl.init.arguments.length === 1 && decl.init.arguments[0].type === 'StringLiteral') {
          // const name = require('mod')
          const source = decl.init.arguments[0].value;
          if (decl.id.type === 'Identifier') {
            // default import
            const imp = t.importDeclaration([t.importDefaultSpecifier(t.identifier(decl.id.name))], t.stringLiteral(source));
            newBody.push(imp);
            changed = true;
            messages.push({ line: node.loc && node.loc.start ? node.loc.start.line : 0, message: `Converted require('${source}') to import` });
            continue;
          } else if (decl.id.type === 'ObjectPattern') {
            // const { a, b } = require('mod') or const { join } = require('path')
            const specifiers = [];
            for (const prop of decl.id.properties) {
              if (prop.type === 'ObjectProperty') {
                const key = prop.key;
                if (key && key.type === 'Identifier') {
                  // Handle both shorthand and non-shorthand: { a } or { a: b }
                  const imported = prop.shorthand ? key.name : (prop.value && prop.value.type === 'Identifier' ? prop.value.name : key.name);
                  specifiers.push(t.importSpecifier(t.identifier(key.name), t.identifier(imported)));
                }
              } else if (prop.type === 'RestElement') {
                // Skip rest elements for now
                break;
              }
            }
            if (specifiers.length > 0) {
              const imp = t.importDeclaration(specifiers, t.stringLiteral(source));
              newBody.push(imp);
              changed = true;
              messages.push({ line: node.loc && node.loc.start ? node.loc.start.line : 0, message: `Converted destructured require('${source}') to named imports` });
              continue;
            }
          }
        }
      } else if (node.type === 'ExpressionStatement' && node.expression && node.expression.type === 'AssignmentExpression') {
        // module.exports = X
        const assign = node.expression;
        if (assign.left.type === 'MemberExpression' &&
            assign.left.object.name === 'module' &&
            assign.left.property.name === 'exports') {
          // replace with export default
          const exportDecl = t.exportDefaultDeclaration(assign.right);
          newBody.push(exportDecl);
          changed = true;
          messages.push({ line: node.loc && node.loc.start ? node.loc.start.line : 0, message: 'Converted module.exports to export default' });
          continue;
        }
      }
      // fallback: keep original node
      newBody.push(node);
    }

    if (changed) {
      ast.program.body = newBody;
    }
    return { changed, messages };
  }
};

