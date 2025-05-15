#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { writeFileSync } from 'fs';
import semver from 'semver';
import { table } from 'table';

const execAsync = promisify(exec);

interface Row {
  package: string;
  type: 'dependency' | 'devDependency';
  current: string;
  latest: string;
  peerRange: string;
  compatible: boolean;
}

function logProgress(current: number, total: number, hide: boolean) {
  if (hide) return;
  const percent = Math.floor((current / total) * 100);
  process.stdout.write(`\r🔄 Processing packages: ${current} / ${total} (${percent}%)`);
}

async function main() {
  const args = process.argv.slice(2);
  const targetPeer = args[0];
  const targetVersion = args[1];

  const flags = {
    json: args.includes('--json'),
    summary: args.includes('--summary'),
    onlyIncompatible: args.includes('--only-incompatible'),
    html: args.includes('--html'),
    hideProgress: args.includes('--hide-progress'),
  };

  const htmlOutput = (() => {
    const idx = args.indexOf('--html');
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  })();

  if (!targetPeer) {
    console.error('\n❌ Please provide a peer dependency name. Example: npx peerdep-checker react 18.2.0');
    process.exit(1);
  }

  const packageJsonRaw = await fs.readFile('package.json', 'utf-8');
  const packageJson = JSON.parse(packageJsonRaw);
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const depNames = Object.keys(allDeps);
  const total = depNames.length;
  let current = 0;

  const results: Row[] = [];

  for (const dep of depNames) {
    current++;
    logProgress(current, total, flags.hideProgress);

    try {
      const { stdout } = await execAsync(`npm info ${dep} version peerDependencies --json`);
      const parsed = JSON.parse(stdout || '{}');
      const peerDeps = parsed.peerDependencies || {};
      const latestVersion = parsed.version || 'unknown';
      const currentVersion = allDeps[dep] || 'unknown';

      if (peerDeps[targetPeer]) {
        const peerRange = peerDeps[targetPeer];
        const compatible = targetVersion ? semver.satisfies(targetVersion, peerRange) : true;

        const type: Row['type'] = packageJson.dependencies?.[dep]
          ? 'dependency'
          : 'devDependency';

        results.push({
          package: dep,
          type,
          current: currentVersion,
          latest: latestVersion,
          peerRange,
          compatible,
        });
      }
    } catch {
      // silently ignore
    }
  }

  process.stdout.write('\n\n');

  const filtered = flags.onlyIncompatible
    ? results.filter(r => !r.compatible)
    : results;

  if (filtered.length === 0) {
    console.log('✅ All packages are compatible with the specified peer dependency.');
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  const rows = [
    ['Package', 'Type', 'Current', 'Latest', `${targetPeer} Peer Range`, 'Compatible'],
    ...filtered.map(r => [
      r.package,
      r.type,
      r.current,
      r.latest,
      r.peerRange,
      r.compatible ? '✅ Yes' : '❌ No',
    ]),
  ];

  console.log(table(rows));

  if (flags.summary) {
    const total = results.length;
    const compatible = results.filter(r => r.compatible).length;
    const incompatible = total - compatible;
    const percent = Math.round((compatible / total) * 100);

    console.log('\n📊 Summary:');
    console.log(`- Total packages checked: ${total}`);
    console.log(`- Compatible: ${compatible}`);
    console.log(`- Incompatible: ${incompatible}`);
    console.log(`- Compatibility Rate: ${percent}%`);
  }

  if (htmlOutput) {
    const html = generateHtmlReport(targetPeer, targetVersion, results);
    writeFileSync(htmlOutput, html, 'utf-8');
    console.log(`\n📝 HTML report written to ${htmlOutput}`);
  }
}

function generateHtmlReport(peer: string, version: string | undefined, rows: Row[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Peer Dependency Report</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    th { background-color: #f5f5f5; }
    .yes { color: green; font-weight: bold; }
    .no { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Peer Dependency Report</h1>
  <p><strong>Peer:</strong> ${peer}</p>
  ${version ? `<p><strong>Target Version:</strong> ${version}</p>` : ''}
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Type</th>
        <th>Current</th>
        <th>Latest</th>
        <th>${peer} Peer Range</th>
        <th>Compatible</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td>${r.package}</td>
          <td>${r.type}</td>
          <td>${r.current}</td>
          <td>${r.latest}</td>
          <td>${r.peerRange}</td>
          <td class="${r.compatible ? 'yes' : 'no'}">${r.compatible ? 'Yes' : 'No'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
}

main();
