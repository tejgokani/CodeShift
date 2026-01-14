# CodeShift

**CodeShift** (package: `codeshift`) is an AST-driven refactor engine that automates repeatable, safe-ish transformations across a codebase. It is **not** a magical converter — transformations are intentionally conservative and must be reviewed before applying to production code.

> ⚠️ **WARNING**: Always run in dry-run mode first (`--apply` is required to write files). Backups are created by default (`.codeshift.bak`).

## Install

```bash
# Install globally
npm install -g codeshift

# Or use with npx (no installation needed)
npx codeshift --help

# Or install as a project dependency
npm install --save-dev codeshift
```

## Usage

### CLI

```bash
# List available transforms
npx codeshift --list

# Dry-run (default) - see what would change
npx codeshift "src/**/*.js" --transform express-to-fastify

# Apply changes (creates backups by default)
npx codeshift "src/**/*.js" --transform express-to-fastify --apply

# Run all transforms
npx codeshift "src/**/*.js" --apply

# Output markdown report
npx codeshift "src/**/*.js" --format md --out report.md

# No backups (not recommended)
npx codeshift "src/**/*.js" --apply --no-backup
```

### Library

```javascript
const { runTransforms, listTransforms } = require('codeshift');

// List available transforms
const transforms = listTransforms();
console.log(transforms);

// Run transforms (dry-run by default)
const report = await runTransforms(['src/**/*.js'], {
  transforms: ['express-to-fastify'],
  apply: false,
  backup: true,
  verbose: true
});

console.log(JSON.stringify(report, null, 2));
```

## Available Transforms

### `express-to-fastify`

Converts simple Express router patterns to Fastify route registration.

**Handles:**
- `router.get('/path', handler)` → `fastify.route({ method: 'GET', url: '/path', handler })`
- `router.post(...)`, `router.put(...)`, etc.

**Limitations:**
- Only handles simple route handlers (no complex middleware chains)
- Does not auto-convert Express-specific middleware (body-parser, etc.)
- Manual verification required

### `cjs-to-esm`

Converts CommonJS `require()` and `module.exports` to ESM `import`/`export`.

**Handles:**
- `const x = require('mod')` → `import x from 'mod'`
- `const {a, b} = require('mod')` → `import {a, b} from 'mod'`
- `module.exports = x` → `export default x`

**Limitations:**
- Only converts files with pure CommonJS (skips files with existing `import`/`export`)
- Does not handle dynamic `require()` calls
- Does not convert `module.exports.foo = bar` patterns

### `mongoose-to-prisma`

Converts simple Mongoose query patterns to Prisma-like calls.

**Handles:**
- `Model.find(query)` → `prisma.model.findMany({ where: query })`
- `Model.findOne(query)` → `prisma.model.findFirst({ where: query })`

**Limitations:**
- Very limited scope — only handles simple `.find()` and `.findOne()` calls
- Does not auto-convert `.save()`, `.create()`, or complex queries
- Assumes Prisma client is available (does not auto-inject imports)
- Model name conversion is lowercase (e.g., `User` → `prisma.user`)

## Safety Features

1. **Dry-run by default** — Use `--apply` to actually write files
2. **Automatic backups** — Creates `.codeshift.bak` files before writing (disable with `--no-backup`)
3. **Syntax validation** — Verifies transformed code parses correctly before writing
4. **Conservative transforms** — Only handles well-defined, simple patterns

## Report Format

Reports include:
- `summary`: Files scanned, transforms run, total changes
- `changes`: Array of change objects with transform ID, file, line, and message

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Link for local testing
npm link
```

## Contributing

Transforms are plugin-style modules in `lib/transforms/`. Each transform exports:
- `id`: Unique identifier
- `description`: Human-readable description
- `matchFiles`: Array of glob patterns for file matching
- `transform(ast, context)`: Function that mutates AST and returns `{ changed: boolean, messages: [] }`

## License

MIT

## Disclaimer

**This tool is provided as-is. Always review changes before committing to production.** Complex migrations require manual intervention and testing.


## Installation

```bash
npm install
```

<!-- Updated via Git Committer -->


<!-- Updated via Git Committer -->

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

<!-- Updated via Git Committer -->

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

<!-- Updated via Git Committer -->


<!-- Updated via Git Committer -->


<!-- Updated via Git Committer -->
