const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend', 'build');
const destDir = path.join(__dirname, '..', 'build');

if (!fs.existsSync(srcDir)) {
  console.error(`[copy-build] source directory not found: ${srcDir}`);
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

const copyRecursive = (source, destination) => {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    const entries = fs.readdirSync(source);
    entries.forEach((entry) => {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    });
  } else {
    fs.copyFileSync(source, destination);
  }
};

copyRecursive(srcDir, destDir);
console.log(`[copy-build] copied ${srcDir} -> ${destDir}`);

