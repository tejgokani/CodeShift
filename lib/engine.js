/**
 * engine.js
 * - Expand globs/directories to files
 * - For each file: read source, parse AST, run selected transforms that match file pattern
 * - Collect changes, validate transformed code parses, write backups and outputs if apply=true
 */

const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const { parseSource, printAst } = require('./parser');

function expandPaths(paths) {
  const results = new Set();
  for (const p of paths) {
    const matches = glob.sync(p, { nodir: false, absolute: true, ignore: ['**/node_modules/**', '**/dist/**'] });
    for (const m of matches) {
      const stat = fs.statSync(m);
      if (stat.isDirectory()) {
        const files = glob.sync(path.join(m, '**/*.{js,ts,jsx,tsx}'), { ignore: ['**/node_modules/**', '**/dist/**'] });
        files.forEach(f => results.add(path.resolve(f)));
      } else if (stat.isFile()) {
        results.add(path.resolve(m));
      }
    }
  }
  return Array.from(results);
}

/**
 * run(paths, options, registry)
 */
async function run(paths, options = {}, registry = {}) {
  const files = expandPaths(paths);
  const report = { summary: { filesScanned: files.length, transformsRun: [], totalChanges: 0 }, changes: [] };

  const transformIds = options.transforms && options.transforms.length ? options.transforms : Object.keys(registry);

  report.summary.transformsRun = transformIds;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    let ast;
    try {
      ast = parseSource(code, file);
    } catch (err) {
      // collect parse error and continue
      report.changes.push({ transformId: 'parse-error', file, line: 0, message: String(err.message) });
      continue;
    }

    for (const tId of transformIds) {
      const t = registry[tId];
      if (!t) continue;
      // simple file matching check
      // t.matchFiles is an array of globs; keep simple: run on js/ts files
      if (!t.matchFiles.some(pattern => file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx'))) continue;

      try {
        // Re-parse to get fresh AST for each transform to avoid cross-transform contamination
        const clonedAst = parseSource(code, file);
        
        const context = { file, code, ast: clonedAst, options };
        const res = await t.transform(clonedAst, context); // transform should mutate AST or return nodes
        if (res && res.changed) {
          // print transformed code and verify parseability
          const newCode = printAst(clonedAst);
          try {
            parseSource(newCode, file); // verify valid
          } catch (verr) {
            // revert: skip writing and report error
            report.changes.push({ transformId: t.id, file, line: 0, message: `Transform produced invalid syntax: ${verr.message}` });
            continue;
          }

          // record change(s)
          (res.messages || []).forEach(m => {
            report.changes.push({ transformId: t.id, file, line: m.line || 0, message: m.message || 'changed' });
            report.summary.totalChanges++;
          });

          if (options.apply) {
            if (options.backup !== false) {
              const bak = `${file}.codeshift.bak`;
              if (!fs.existsSync(bak)) fs.writeFileSync(bak, code, 'utf8'); // keep original if not exist
            }
            fs.writeFileSync(file, newCode, 'utf8');
            if (options.verbose) console.log(`Wrote transformed file ${file}`);
          }
        }
      } catch (e) {
        report.changes.push({ transformId: t.id, file, line: 0, message: `Transform error: ${String(e.message || e)}` });
        if (options.verbose) console.error(`Transform ${t.id} failed on ${file}:`, e);
      }
    } // transforms loop
  } // file loop

  // attach markdown if requested (simple)
  if (options.format === 'md') {
    report.markdown = generateMarkdown(report);
  }

  return report;
}

function generateMarkdown(report) {
  const lines = [];
  lines.push(`# CodeShift Report`);
  lines.push(`**Files scanned:** ${report.summary.filesScanned}`);
  lines.push(`**Transforms run:** ${report.summary.transformsRun.join(', ')}`);
  lines.push(`**Total changes:** ${report.summary.totalChanges}`);
  lines.push('');

  for (const c of report.changes) {
    lines.push(`- [${c.transformId}] ${c.file}:${c.line} — ${c.message}`);
  }
  return lines.join('\n');
}

module.exports = { run };

