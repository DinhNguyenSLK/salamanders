const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const read = name => fs.readFileSync(path.join(__dirname, '../app/frontend/js', name), 'utf8');

function fixture() {
  const nodes = new Map();
  const readers = [];
  function node(id) {
    const classes = new Set();
    const el = {
      id, value: '', dataset: {}, style: {}, isConnected: true,
      classList: {
        toggle(key, enabled) { enabled ? classes.add(key) : classes.delete(key); },
        contains(key) { return classes.has(key); },
      },
      setAttribute(key, value) { this[key] = value; },
      getAttribute(key) { return this[key]; },
      removeAttribute(key) { delete this[key]; },
      querySelector() { return this; },
      focus() { this.focused = true; },
    };
    nodes.set(id, el);
    return el;
  }
  for (let idx = 0; idx < 2; idx++) {
    for (const prefix of ['panel_image', 'channel_image', 'sceneImageUrl', 'sceneImageFile', 'sceneImageStatus', 'sceneImagePreview', 'sceneImageThumb', 'textual', 'textualLanguage', 'ocr', 'asr', 'not', 'tags']) node(prefix + idx);
  }
  const context = vm.createContext({
    URL, console, config: {}, canvasWidth: 300, canvasHeight: 200,
    document: { getElementById: id => nodes.get(id), addEventListener() {} },
    isCanvasClean: [], textualMode: ['siglip2', 'align'], occur: [], isCanvasEnabled: [], canvases: [],
    tempSearchForms: 2,
    FileReader: class { constructor() { readers.push(this); } readAsDataURL() {} },
    $(selector) {
      const el = nodes.get(selector.slice(1));
      return {
        length: el ? 1 : 0,
        val(value) { if (value !== undefined && el) el.value = value; return el?.value || ''; },
        attr(key) { return el?.[key]; },
        is() { return false; },
        prop() {},
      };
    },
  });
  vm.runInContext(read('queryByExample.js'), context);
  vm.runInContext(read('search_bar_templates.js'), context);
  const source = read('visione.js');
  vm.runInContext(source.slice(source.indexOf('function parseObjectCountField('), source.indexOf('function timestamp(')), context);
  vm.runInContext(source.slice(source.indexOf('function collectTemporalSearchItems('), source.indexOf('function searchByLink(')), context);
  for (const name of ['prevTextual', 'prevTextualMode', 'prevOccur', 'prevNotField', 'prevOcrField', 'prevAsrField', 'prevTagsField', 'prevIsColor', 'prevIsGray', 'prevCanvasObjects']) context[name] = [];
  vm.runInContext(source.slice(source.indexOf('function sceneHasContent('), source.indexOf('function canvasClean(')), context);
  return { context, nodes, readers };
}

test('each scene generates unique channel controls and image inputs', () => {
  const { context } = fixture();
  const html = vm.runInContext('searchForm(0) + searchForm(1)', context);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((html.match(/class="channel-button"/g) || []).length, 14);
  assert.ok(ids.includes('textual0') && ids.includes('textual1'));
  assert.ok(ids.includes('textualLanguage0') && ids.includes('textualLanguage1'));
});

test('channel visibility preserves the scene image and synchronizes accessible state', () => {
  const { context: c, nodes } = fixture();
  c.renderSceneImage(0, 'https://example.com/one.png');
  c.setSceneChannel(0, 'image', true, true);
  assert.equal(nodes.get('channel_image0')['aria-expanded'], 'true');
  c.toggleSceneChannel(0, 'image');
  assert.equal(nodes.get('channel_image0')['aria-pressed'], 'false');
  assert.ok(nodes.get('panel_image0').classList.contains('collapsed'));
  assert.equal(c.getSceneImage(0), 'https://example.com/one.png');
  assert.equal(c.getSceneImage(1), '');
});

test('mixed text and images stay paired with their temporal scenes and models', () => {
  const { context: c, nodes } = fixture();
  nodes.get('textual0').value = 'a red car';
  c.renderSceneImage(0, 'https://example.com/one.png');
  c.renderSceneImage(1, 'data:image/png;base64,AAAA');
  const result = JSON.parse(JSON.stringify(c.collectTemporalSearchItems()));
  assert.deepEqual(result.queryItems, [
    { qbe: 'https://example.com/one.png', textual: 'a red car' },
    { qbe: 'data:image/png;base64,AAAA' },
  ]);
  assert.deepEqual(result.paramItems.map(p => p.textual_model), ['siglip2', 'align']);
});

test('English bypass is selected per scene and survives clear/undo', () => {
  const { context: c, nodes } = fixture();
  nodes.get('textual0').value = 'a red car';
  nodes.get('textual1').value = 'một chiếc xe';
  nodes.get('textualLanguage0').value = 'en';
  let result = JSON.parse(JSON.stringify(c.collectTemporalSearchItems()));
  assert.deepEqual(result.paramItems.map(p => p.textual_language), ['en', 'vi']);
  c.sceneClean(0);
  assert.equal(nodes.get('textualLanguage0').value, 'vi');
  c.sceneCleanUndo(0);
  result = JSON.parse(JSON.stringify(c.collectTemporalSearchItems()));
  assert.equal(result.queryItems[0].textual, 'a red car');
  assert.equal(result.paramItems[0].textual_language, 'en');
});

test('URL validation, clear and undo preserve independent scene examples', () => {
  const { context: c, nodes } = fixture();
  const input = nodes.get('sceneImageUrl0');
  input.value = 'https://example.com/one.png';
  c.setSceneImageUrl(0, input);
  c.renderSceneImage(1, 'https://example.com/two.png');
  assert.ok(c.sceneHasContent(0));
  c.sceneClean(0);
  assert.equal(c.getSceneImage(0), '');
  assert.equal(c.getSceneImage(1), 'https://example.com/two.png');
  c.sceneCleanUndo(0);
  assert.equal(c.getSceneImage(0), 'https://example.com/one.png');
  assert.equal(input.value, 'https://example.com/one.png');
  input.value = 'javascript:alert(1)';
  c.setSceneImageUrl(0, input);
  assert.equal(c.getSceneImage(0), '');
  assert.match(nodes.get('sceneImageStatus0').textContent, /http/);
});

test('late file reads cannot overwrite a newer URL or a cleared image', () => {
  const { context: c, nodes, readers } = fixture();
  const file = nodes.get('sceneImageFile0');
  file.files = [{ type: 'image/png', name: 'one.png' }];
  c.uploadSceneImage(0, file);
  readers[0].result = 'data:image/png;base64,AAAA';
  readers[0].onload();
  assert.equal(c.getSceneImage(0), readers[0].result);
  c.uploadSceneImage(0, file);
  const input = nodes.get('sceneImageUrl0');
  input.value = 'https://example.com/new.png';
  c.setSceneImageUrl(0, input);
  readers[1].result = 'data:image/png;base64,OLD';
  readers[1].onload();
  assert.equal(c.getSceneImage(0), input.value);
  c.uploadSceneImage(0, file);
  c.clearSceneImage(0);
  readers[2].onload();
  assert.equal(c.getSceneImage(0), '');
});
