const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message) => {
  console.log(`[vercel-build] ${message}`);
};

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

const run = (command, cwd) => {
  log(`running "${command}" in ${cwd}`);
  execSync(command, { cwd, stdio: 'inherit' });
};

const currentDir = process.cwd();
const currentDirName = path.basename(currentDir);
const isRunningInsideFrontend = currentDirName === 'frontend';
const isRunningInsideApi = currentDirName === 'api';
const rootDir = (() => {
  if (isRunningInsideFrontend) return path.resolve(currentDir, '..');
  if (isRunningInsideApi) return path.resolve(currentDir, '..');
  return currentDir;
})();
const frontendDir = (() => {
  if (isRunningInsideFrontend) return currentDir;
  const candidateFromRoot = path.join(rootDir, 'frontend');
  if (fs.existsSync(candidateFromRoot)) {
    return candidateFromRoot;
  }
  if (isRunningInsideApi) {
    const candidateFromApi = path.join(rootDir, '..', 'frontend');
    if (fs.existsSync(candidateFromApi)) {
      return candidateFromApi;
    }
  }
  return candidateFromRoot;
})();
const destDir = path.join(rootDir, 'build');
const srcDir = path.join(frontendDir, 'build');

if (!fs.existsSync(frontendDir)) {
  console.error(`[vercel-build] unable to locate frontend directory at ${frontendDir}`);
  process.exit(1);
}

run('npm run build', frontendDir);

if (!fs.existsSync(srcDir)) {
  console.error(`[vercel-build] CRA build did not produce ${srcDir}`);
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });
copyRecursive(srcDir, destDir);
log(`copied ${srcDir} -> ${destDir}`);

