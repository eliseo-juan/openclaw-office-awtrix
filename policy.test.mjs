import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('installation example denies prompt and conversation hooks before activation', async () => {
  const config = JSON.parse(await readFile(new URL('./plugin-config.example.json', import.meta.url), 'utf8'));
  const entry = config.plugins.entries['openclaw-office'];
  assert.equal(entry.enabled, false);
  assert.deepEqual(entry.hooks, {allowPromptInjection: false, allowConversationAccess: false});
  const readme = await readFile(new URL('./README.md', import.meta.url), 'utf8');
  for (const name of Object.keys(entry.hooks)) assert.ok(readme.includes(`"${name}": false`));
});
