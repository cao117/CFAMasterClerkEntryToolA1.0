// Keeps the app version identical across package.json, package-lock.json, tauri.conf.json,
// Cargo.toml and Cargo.lock. Edits by targeted replacement so formatting is preserved.
//
//   node scripts/bump-version.mjs 1.0.1                  bump all files (refuses if tag v1.0.1 exists)
//   node scripts/bump-version.mjs --check                print the shared version, fail if files disagree
//   node scripts/bump-version.mjs --check --tag v1.0.1   also fail if the tag is not v<version>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const V = String.raw`(\d+\.\d+\.\d+)`;

// Each location: the file, and a regex whose groups are (prefix)(version)(suffix).
const LOCATIONS = [
  { key: 'packageJson', file: 'package.json', re: new RegExp(String.raw`(^  "version": ")${V}(")`, 'm') },
  { key: 'packageLockRoot', file: 'package-lock.json', re: new RegExp(String.raw`(^  "version": ")${V}(")`, 'm') },
  {
    key: 'packageLockPackage',
    file: 'package-lock.json',
    re: new RegExp(String.raw`("packages": \{\s*"": \{[^}]*?"version": ")${V}(")`),
  },
  { key: 'tauriConf', file: 'src-tauri/tauri.conf.json', re: new RegExp(String.raw`(^  "version": ")${V}(")`, 'm') },
  {
    key: 'cargoToml',
    file: 'src-tauri/Cargo.toml',
    re: new RegExp(String.raw`(\[package\]\r?\n(?:[^\[\r\n][^\r\n]*\r?\n)*?version = ")${V}(")`),
  },
  {
    key: 'cargoLock',
    file: 'src-tauri/Cargo.lock',
    re: new RegExp(String.raw`(\[\[package\]\]\r?\nname = "app"\r?\nversion = ")${V}(")`),
  },
];

const globalOf = (re) => new RegExp(re.source, re.flags.replace('g', '') + 'g');

function matchCount(text, re) {
  return [...text.matchAll(globalOf(re))].length;
}

export function readVersions(rootDir) {
  const versions = {};
  for (const { key, file, re } of LOCATIONS) {
    const text = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const n = matchCount(text, re);
    if (n !== 1) throw new Error(`${file}: expected exactly one ${key} version, found ${n}`);
    versions[key] = text.match(re)[2];
  }
  return versions;
}

export function assertConsistent(versions) {
  const unique = new Set(Object.values(versions));
  if (unique.size === 1) return [...unique][0];
  const lines = LOCATIONS.map(({ key, file }) => `  ${file} (${key}): ${versions[key]}`);
  throw new Error(`Version files disagree:\n${lines.join('\n')}`);
}

export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function assertTagMatches(version, tag) {
  if (tag !== `v${version}`) {
    throw new Error(`Tag "${tag}" does not match the app version ${version}; expected tag "v${version}".`);
  }
}

export function bumpVersion(rootDir, newVersion) {
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    throw new Error(`"${newVersion}" is not a valid version; use X.Y.Z (e.g. 1.0.1).`);
  }
  if (Number(newVersion.split('.')[0]) < 1) {
    throw new Error(`Major version must be >= 1: the Microsoft Store rejects packages below 1.0.0.0.`);
  }
  const current = assertConsistent(readVersions(rootDir));
  if (compareVersions(newVersion, current) <= 0) {
    throw new Error(`New version ${newVersion} must be greater than the current version ${current}.`);
  }

  // Compute every new file in memory first; write only if all replacements succeeded.
  const contents = new Map();
  for (const { file, re } of LOCATIONS) {
    const text = contents.get(file) ?? fs.readFileSync(path.join(rootDir, file), 'utf8');
    const n = matchCount(text, re);
    if (n !== 1) throw new Error(`${file}: expected exactly one match for ${re}, found ${n}`);
    contents.set(file, text.replace(re, (_m, pre, _old, post) => `${pre}${newVersion}${post}`));
  }
  for (const [file, text] of contents) fs.writeFileSync(path.join(rootDir, file), text);
  return { from: current, to: newVersion };
}

function tagExists(rootDir, tag) {
  return execFileSync('git', ['tag', '-l', tag], { cwd: rootDir, encoding: 'utf8' }).trim() === tag;
}

const USAGE = `Usage:
  node scripts/bump-version.mjs <X.Y.Z>
  node scripts/bump-version.mjs --check [--tag vX.Y.Z]`;

function main(argv) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const [first, ...rest] = argv;

  if (first === '--check') {
    let tag;
    if (rest.length === 2 && rest[0] === '--tag' && rest[1]) tag = rest[1];
    else if (rest.length !== 0) throw new UsageError();
    const version = assertConsistent(readVersions(rootDir));
    if (tag !== undefined) assertTagMatches(version, tag);
    console.log(version);
    return;
  }

  if (argv.length === 1 && first && !first.startsWith('-')) {
    if (tagExists(rootDir, `v${first}`)) throw new Error(`Git tag v${first} already exists.`);
    const { from, to } = bumpVersion(rootDir, first);
    console.log(`Version ${from} → ${to}`);
    console.log('Files changed:');
    for (const file of new Set(LOCATIONS.map((l) => l.file))) console.log(`  ${file}`);
    return;
  }

  throw new UsageError();
}

class UsageError extends Error {
  constructor() {
    super(USAGE);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
