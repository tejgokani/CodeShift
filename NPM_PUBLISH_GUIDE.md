# CodeShift - NPM Publishing Guide

## Quick Start

### 1. Update Repository URLs (Required)

Edit `package.json` and replace `yourusername` with your actual GitHub username:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/codeshift.git"
},
"bugs": {
  "url": "https://github.com/YOUR_USERNAME/codeshift/issues"
},
"homepage": "https://github.com/YOUR_USERNAME/codeshift#readme"
```

### 2. Optional: Add Author Information

Edit `package.json`:

```json
"author": "Your Name <your.email@example.com>"
```

### 3. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 4. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

You should see only these files:
- `bin/teleporter.js`
- `lib/` (all transform files)
- `index.js`
- `LICENSE`
- `README.md`
- `package.json`
- `CHANGELOG.md` (if included)

### 5. Test Package Locally (Optional)

```bash
# Create a tarball
npm pack

# Test installing it
npm install -g ./codeshift-0.1.0.tgz

# Test the CLI
codeshift --list

# Uninstall test version
npm uninstall -g codeshift
```

### 6. Publish to npm

```bash
npm publish
```

If the package name `codeshift` is already taken, you'll need to:
- Use a scoped package: `@yourusername/codeshift`
- Or choose a different name

For scoped packages:
```bash
npm publish --access public
```

### 7. Verify Publication

```bash
# Check package info
npm view codeshift

# Test installation
npm install -g codeshift
codeshift --list

# Or use with npx
npx codeshift --list
```

## Post-Publish

1. **Create Git Tag**:
   ```bash
   git tag v0.1.0
   git push --tags
   ```

2. **Create GitHub Release** (if using GitHub):
   - Go to your repository
   - Create a new release
   - Tag: `v0.1.0`
   - Title: `CodeShift v0.1.0`
   - Description: Copy from CHANGELOG.md

## Troubleshooting

### Package name already taken
- Use a scoped package: `@yourusername/codeshift`
- Update `package.json` name field
- Publish with: `npm publish --access public`

### Authentication errors
- Make sure you're logged in: `npm whoami`
- If not: `npm login`

### Permission errors
- Check if you have publish rights to the package name
- For scoped packages, ensure you're logged in to the correct npm account

## Package Information

- **Name**: `codeshift`
- **Version**: `0.1.0`
- **License**: MIT
- **Node**: >=16
- **Size**: ~9.2 kB

## Commands Summary

```bash
# 1. Update package.json (repository URLs, author)
# 2. Login
npm login

# 3. Verify
npm pack --dry-run

# 4. Publish
npm publish

# 5. Verify
npm view codeshift
npx codeshift --list
```

Good luck with your launch! 🚀

