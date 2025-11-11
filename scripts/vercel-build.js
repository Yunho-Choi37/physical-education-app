const ensureDependencies = (directory) => {
  const packageJsonPath = path.join(directory, 'package.json');
  const nodeModulesPath = path.join(directory, 'node_modules');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`[vercel-build] no package.json found in ${directory}`);
    process.exit(1);
  }

  if (!fs.existsSync(nodeModulesPath) || fs.readdirSync(nodeModulesPath).length === 0) {
    log(`installing dependencies in ${directory}`);
    execSync('npm install', { cwd: directory, stdio: 'inherit' });
  }
};
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
  const candidates = [];
  if (isRunningInsideFrontend) {
    candidates.push(currentDir);
  } else {
    candidates.push(path.join(currentDir, 'frontend'));
    candidates.push(path.join(rootDir, 'frontend'));
    candidates.push(path.join(rootDir, '..', 'frontend'));
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1];
})();
const destDir = path.join(rootDir, 'build');
const cwdDestDir = path.join(currentDir, 'build');
const srcDir = path.join(frontendDir, 'build');

if (!fs.existsSync(frontendDir)) {
  console.error(`[vercel-build] unable to locate frontend directory at ${frontendDir}`);
  process.exit(1);
}

ensureDependencies(frontendDir);
run('npm run build', frontendDir);

if (!fs.existsSync(srcDir)) {
  console.error(`[vercel-build] CRA build did not produce ${srcDir}`);
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });
copyRecursive(srcDir, destDir);
log(`copied ${srcDir} -> ${destDir}`);

if (path.resolve(destDir) !== path.resolve(cwdDestDir)) {
  fs.rmSync(cwdDestDir, { recursive: true, force: true });
  fs.mkdirSync(cwdDestDir, { recursive: true });
  copyRecursive(srcDir, cwdDestDir);
  log(`mirrored ${srcDir} -> ${cwdDestDir}`);
}

