const fs = require('fs');
const path = require('path');

const targetDirectory = path.resolve(process.cwd(), process.argv[2] || 'dist');
const invalidImportPattern = /require\(["'](\.\.\/)+building-blocks\//;
const matchedFiles = [];

const walk = (directory) => {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) {
      continue;
    }

    const content = fs.readFileSync(entryPath, 'utf8');

    if (invalidImportPattern.test(content)) {
      matchedFiles.push(path.relative(process.cwd(), entryPath));
    }
  }
};

walk(targetDirectory);

if (matchedFiles.length > 0) {
  console.error('Detected invalid Swagger-generated relative imports to building-blocks:');

  for (const file of matchedFiles) {
    console.error(`- ${file}`);
  }

  process.exit(1);
}

console.log(`Swagger import verification passed for ${path.relative(process.cwd(), targetDirectory) || targetDirectory}`);
