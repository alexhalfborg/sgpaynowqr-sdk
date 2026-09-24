// Bumps a package's version, commits, tags and pushes. The tag push triggers
// .github/workflows/publish.yml, which publishes to npm with provenance.
//
//   npm run release -- sdk minor     ->  tag sdk-v0.2.0
//   npm run release -- mcp patch     ->  tag mcp-v0.1.1

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PACKAGES = { sdk: ".", mcp: "mcp" };
const BUMPS = ["patch", "minor", "major"];

const [name, bump] = process.argv.slice(2);
const dir = PACKAGES[name];
if (!dir || !BUMPS.includes(bump)) {
  console.error("Usage: npm run release -- <sdk|mcp> <patch|minor|major>");
  process.exit(1);
}

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const read = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

if (read("git rev-parse --abbrev-ref HEAD") !== "main") {
  console.error("Release from the main branch.");
  process.exit(1);
}
if (read("git status --porcelain")) {
  console.error("Commit or stash your changes first.");
  process.exit(1);
}
run("git pull --ff-only");

// Updates package.json and package-lock.json only; the tag is made below so it
// gets the package prefix (npm's own tagging doesn't work from mcp/).
run(`npm version ${bump} --no-git-tag-version`, { cwd: dir });
const { version } = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));
const tag = `${name}-v${version}`;

run(`git add ${dir}/package.json ${dir}/package-lock.json`);
run(`git commit -m "Release ${name} ${version}"`);
run(`git tag -a ${tag} -m "${name} ${version}"`);
run(`git push origin main ${tag}`);

console.log(`\nPushed ${tag}. Watch the publish with: gh run watch`);
