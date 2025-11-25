#!/usr/bin/env node

// CLI for CodeShift
// Usage: npx codeshift <paths...> [--transform <id>] [--apply] [--format json|md] [--out file] [--no-backup]

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { runTransforms, listTransforms } = require('../index');

const pkg = require('../package.json');

const program = new Command();
program.name('codeshift').version(pkg.version);

program
  .argument('[paths...]', 'files or globs or directories to transform')
  .option('--transform <id>', 'run only the named transform')
  .option('--list', 'list available transforms and exit')
  .option('--apply', 'apply changes to disk (default is dry-run)')
  .option('--no-backup', 'do not write .codeshift.bak backups when applying')
  .option('--format <fmt>', 'output format: json|md', 'json')
  .option('--out <file>', 'write output report to file')
  .option('--verbose', 'verbose logging')
  .action(async (paths, opts) => {
    try {
      if (opts.list) {
        const available = listTransforms();
        console.log(chalk.green('Available transforms:'));
        for (const t of available) {
          console.log(` - ${t.id}: ${t.description}`);
        }
        process.exit(0);
      }

      if (!paths || paths.length === 0) {
        console.error(chalk.red('Error: No paths specified. Use --list to see available transforms.'));
        program.help();
        process.exit(1);
      }

      const options = {
        transforms: opts.transform ? [opts.transform] : undefined,
        apply: Boolean(opts.apply),
        backup: opts.backup !== false,
        verbose: Boolean(opts.verbose),
        format: opts.format || 'json'
      };

      const report = await runTransforms(paths, options);

      const output = options.format === 'md' ? report.markdown || reportToMarkdown(report) : JSON.stringify(report, null, 2);
      if (opts.out) {
        fs.writeFileSync(path.resolve(opts.out), output, 'utf8');
        console.log(chalk.green(`Report written to ${opts.out}`));
      } else {
        console.log(output);
      }

      if (options.apply) {
        console.log(chalk.yellow('Apply mode used — verify backups and review changes before committing.'));
      } else {
        console.log(chalk.blue('Dry run complete. Use --apply to write changes.'));
      }

      process.exit(0);
    } catch (err) {
      console.error(chalk.red('Teleporter failed:'), err && err.stack ? err.stack : err);
      process.exit(2);
    }
  });

program.parse(process.argv);

function reportToMarkdown(report) {
  const lines = [];
  lines.push(`# CodeShift Report`);
  lines.push(`**Files scanned:** ${report.summary.filesScanned}`);
  lines.push(`**Transforms run:** ${report.summary.transformsRun.join(', ') || 'none'}`);
  lines.push(`**Total changes suggested:** ${report.summary.totalChanges}`);
  lines.push('');

  for (const change of report.changes) {
    lines.push(`## ${change.transformId}`);
    lines.push(`- **File:** ${change.file}`);
    lines.push(`- **Line:** ${change.line}`);
    lines.push(`- **Message:** ${change.message}`);
    lines.push('');
  }

  return lines.join('\n');
}

