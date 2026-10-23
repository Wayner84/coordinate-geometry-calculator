import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('circle UI exposes point count, three envelope results, plot and logo', async () => {
  const html = await source('index.html');
  assert.match(html, /id="circle-count"[^>]+min="3"[^>]+max="50"/);
  assert.match(html, /Maximum inscribed/);
  assert.match(html, /Minimum circumscribed/);
  assert.match(html, /id="circle-plot"/);
  assert.match(html, /tpl-logo-pink\.png/);
  assert.match(html, /share the best-fit centre/i);
});

test('line UI exposes independent point counts and a fitted-line plot', async () => {
  const html = await source('index.html');
  assert.match(html, /id="line1-count"[^>]+min="2"[^>]+max="50"/);
  assert.match(html, /id="line2-count"[^>]+min="2"[^>]+max="50"/);
  assert.match(html, /id="line-plot"/);
});

test('drawing code renders three circle solutions with dashed envelopes', async () => {
  const app = await source('src/app.js');
  assert.match(app, /drawCircle/);
  assert.match(app, /averageRadius/);
  assert.match(app, /minRadius/);
  assert.match(app, /maxRadius/);
  assert.match(app, /setLineDash/);
  assert.match(app, /drawLines/);
});
