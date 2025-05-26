import assert from 'assert';
import path from 'path';
import fs from 'fs';
import os from 'os';
import nitroQuillImport from '../dist/module.js';
const nitroQuill = nitroQuillImport.default || nitroQuillImport;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quill-'));
fs.mkdirSync(path.join(tmp, 'api'));
fs.writeFileSync(path.join(tmp, 'api', 'get_users.sql'), 'SELECT 1;');
fs.mkdirSync(path.join(tmp, 'api', 'admin'));
fs.writeFileSync(path.join(tmp, 'api', 'admin', 'get_admin.sql'), 'SELECT 1;');

const nitro = {
  options: { rootDir: tmp, virtual: {}, handlers: [] },
  hooks: { fn: null, hook(event, cb){ if(event==='nitro:build:before') this.fn = cb; } }
};

nitroQuill(nitro, {});
await nitro.hooks.fn();
assert.strictEqual(nitro.options.handlers.length, 2);
const routes = nitro.options.handlers.map(h=>h.route).sort();
assert.deepStrictEqual(routes, ['/api/admin/getAdmin', '/api/getUsers']);
console.log('ok');
