#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const versionFile = path.join(rootDir, 'version.txt');
const packageJsonFile = path.join(rootDir, 'package.json');
const serviceAccountFile = path.join(rootDir, 'firebase-service-account.json');

function readVersion() {
  const raw = readFileSync(versionFile, 'utf8').trim();
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid version in ${versionFile}: "${raw}"`);
  }
  return num;
}

function bumpVersion(current) {
  return (Math.round((current + 0.1) * 10) / 10).toFixed(1);
}

function updatePackageJson(newVersion) {
  const pkg = JSON.parse(readFileSync(packageJsonFile, 'utf8'));
  pkg.version = newVersion;
  writeFileSync(packageJsonFile, `${JSON.stringify(pkg, null, 2)}\n`);
}

function run(command, { env: extraEnv } = {}) {
  execSync(command, {
    stdio: 'inherit',
    cwd: rootDir,
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
}

const currentVersion = readVersion();
const nextVersion = bumpVersion(currentVersion);
writeFileSync(versionFile, `${nextVersion}\n`);
updatePackageJson(nextVersion);

run('npm run build');
run('git add .');
run(`git commit -m "bump version to v${nextVersion}"`, { env: { SKIP_DEPLOY_HOOK: '1' } });
// TODO: cuando la service account tenga Service Usage Consumer, cambiar a `firebase deploy` completo.
run(`GOOGLE_APPLICATION_CREDENTIALS=${serviceAccountFile} npx --yes firebase-tools deploy --only hosting`);
run('git push origin main', { env: { SKIP_DEPLOY_HOOK: '1' } });
