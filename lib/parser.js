/**
 * parser.js - parse/print helpers using recast + @babel/parser
 * Exports:
 *  - parseSource(code, filePath)
 *  - printAst(ast) -> code
 */

const recast = require('recast');
const babelParser = require('@babel/parser');

function getParserOptions(filePath) {
  const isTS = /\.tsx?$/.test(filePath);
  return {
    parser: {
      parse(source) {
        return babelParser.parse(source, {
          sourceType: 'module',
          plugins: [
            'jsx',
            isTS ? 'typescript' : 'flow',
            'classProperties',
            'dynamicImport',
            'optionalChaining',
            'nullishCoalescingOperator'
          ]
        });
      }
    }
  };
}

function parseSource(code, filePath = 'file.js') {
  // recast.parse accepts a parser option
  return recast.parse(code, getParserOptions(filePath));
}

function printAst(ast) {
  return recast.print(ast).code;
}

module.exports = { parseSource, printAst };

