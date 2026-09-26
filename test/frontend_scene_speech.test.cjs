const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../app/frontend/js/sceneSpeech.js'), 'utf8');

function fixture({ supported = true, secure = true, prefixed = false } = {}) {
  const nodes = new Map();
  const listeners = {};
  const instances = [];
  const timers = new Map();
  const document = {
    getElementById: id => nodes.get(id),
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  function node(id, value = '') {
    const classes = new Set();
    const icon = {};
    const el = {
      id, value, textContent: '', style: {}, disabled: false,
      classList: { toggle(key, enabled) { enabled ? classes.add(key) : classes.delete(key); } },
      setAttribute(key, val) { this[key] = val; },
      querySelector: () => icon,
      dispatchEvent(event) { listeners[event.type]?.({ target: this }); },
    };
    nodes.set(id, el);
    return el;
  }
  for (let i = 0; i < 2; i++) {
    for (const prefix of ['textual', 'textualLanguage', 'speechButton', 'speechStatus', 'cancelText']) node(prefix + i);
  }
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.started = true; }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; this.onend?.(); }
  }
  const window = { isSecureContext: secure, addEventListener(type, fn) { listeners[type] = fn; } };
  if (supported) window[prefixed ? 'webkitSpeechRecognition' : 'SpeechRecognition'] = Recognition;
  vm.runInNewContext(source, {
    window, document, Event,
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  return { api: window.SceneSpeech, nodes, node, instances, listeners, timers };
}

function result(text, isFinal) { return Object.assign([{ transcript: text }], { isFinal }); }

test('Vietnamese dictation appends final text once and only previews interim text', () => {
  const { api, nodes, instances } = fixture();
  nodes.get('textual0').value = 'Existing description';
  api.toggle(0);
  const r = instances[0];
  assert.equal(r.lang, 'vi-VN');
  r.onstart();
  assert.equal(nodes.get('speechButton0')['aria-pressed'], 'true');
  r.onresult({ results: [result('một chiếc xe', false)] });
  assert.equal(nodes.get('textual0').value, 'Existing description');
  assert.match(nodes.get('speechStatus0').textContent, /một chiếc xe/);
  r.onresult({ results: [result('một chiếc xe đỏ', true)] });
  r.onresult({ results: [result('một chiếc xe đỏ', true), result('trên đường', true)] });
  assert.equal(nodes.get('textual0').value, 'Existing description một chiếc xe đỏ trên đường');
  assert.equal(nodes.get('cancelText0').style.display, 'block');
  assert.ok(!r.aborted, 'programmatic input must not cancel dictation');
  r.onend();
  assert.equal(nodes.get('speechButton0')['aria-pressed'], 'false');
});

test('English selection uses en-US and stopping accepts the final pending result', () => {
  const { api, nodes, instances, timers } = fixture({ prefixed: true });
  nodes.get('textualLanguage1').value = 'en';
  api.toggle(1);
  const r = instances[0];
  assert.equal(r.lang, 'en-US');
  api.toggle(1);
  assert.ok(r.stopped);
  r.onresult({ results: [result('a red car', true)] });
  r.onend();
  assert.equal(nodes.get('textual1').value, 'a red car');
  assert.equal(nodes.get('textual0').value, '');
  assert.equal(timers.size, 0);
});

test('switching scenes cancels the old session and ignores late results', () => {
  const { api, nodes, instances } = fixture();
  api.toggle(0);
  const old = instances[0];
  api.toggle(1);
  assert.ok(old.aborted);
  old.onresult({ results: [result('late words', true)] });
  old.onend();
  assert.equal(nodes.get('textual0').value, '');
  assert.equal(nodes.get('speechButton1')['aria-pressed'], 'true');
});

test('clearing/removing a scene cannot write into a replacement with the same ID', () => {
  const { api, nodes, node, instances } = fixture();
  api.toggle(0);
  api.cancel(0);
  node('textual0', 'new scene');
  instances[0].onresult({ results: [result('old audio', true)] });
  assert.equal(nodes.get('textual0').value, 'new scene');
});

test('manual editing, language changes and page exit release the microphone', () => {
  const { api, nodes, instances, listeners } = fixture();
  api.toggle(0);
  nodes.get('textual0').value = 'manual edit';
  listeners.input({ target: nodes.get('textual0') });
  assert.ok(instances[0].aborted);
  api.toggle(0);
  listeners.change({ target: nodes.get('textualLanguage0') });
  assert.ok(instances[1].aborted);
  api.toggle(0);
  listeners.pagehide();
  assert.ok(instances[2].aborted);
  assert.equal(nodes.get('textual0').value, 'manual edit');
});

test('permission/network errors preserve existing text and allow retry', () => {
  const { api, nodes, instances } = fixture();
  nodes.get('textual0').value = 'keep this';
  api.toggle(0);
  instances[0].onerror({ error: 'not-allowed' });
  assert.match(nodes.get('speechStatus0').textContent, /denied/);
  assert.equal(nodes.get('speechButton0')['aria-pressed'], 'false');
  api.toggle(0);
  instances[1].onerror({ error: 'network' });
  assert.match(nodes.get('speechStatus0').textContent, /connection/);
  assert.equal(nodes.get('textual0').value, 'keep this');
});

test('unsupported browsers and insecure pages show a useful unavailable state', () => {
  for (const options of [{ supported: false }, { secure: false }]) {
    const { api, nodes, instances } = fixture(options);
    api.initScene(0);
    assert.ok(nodes.get('speechButton0').disabled);
    assert.ok(nodes.get('speechStatus0').textContent);
    api.toggle(0);
    assert.equal(instances.length, 0);
  }
});

test('stop timeout aborts recognition if the service never responds', () => {
  const { api, instances, timers, nodes } = fixture();
  api.toggle(0);
  api.toggle(0);
  [...timers.values()][0]();
  assert.ok(instances[0].aborted);
  assert.equal(nodes.get('speechButton0')['aria-pressed'], 'false');
});
