import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('installation example denies prompt and conversation hooks before activation', async () => {
  const config = JSON.parse(await readFile(new URL('./plugin-config.example.json', import.meta.url), 'utf8'));
  const entry = config.plugins.entries['openclaw-office'];
  assert.equal(entry.enabled, false);
  assert.deepEqual(entry.hooks, {allowPromptInjection: false, allowConversationAccess: false});
});

test('bundled installer skill and its installation guide ship with the package', async () => {
  const manifest = JSON.parse(await readFile(new URL('./openclaw.plugin.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.skills, ['./skills']);
  const skill = await readFile(new URL('./skills/install-openclaw-office/SKILL.md', import.meta.url), 'utf8');
  assert.ok(skill.startsWith('---\nname: install-openclaw-office\n'));
  const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
  for (const path of ['skills', 'docs', 'scripts']) assert.ok(pkg.files.includes(path));
});
