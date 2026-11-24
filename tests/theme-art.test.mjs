import test from 'node:test';
import assert from 'node:assert/strict';
import {themeAssets,themeImage,normalizeInvite,formatInvite} from '../src/lib/themeArt.js';
test('every theme has a distinct bundled scene',()=>{assert.equal(themeAssets.length,12);assert.equal(new Set(themeAssets).size,12);for(const url of themeAssets){assert.ok(url.startsWith('data:image/svg+xml'));const svg=decodeURIComponent(url.split(',')[1]);assert.ok(svg.startsWith('<svg'));assert.ok(svg.endsWith('</svg>'));assert.ok(svg.length>1000);}});
test('invite formatting retains all sixteen characters',()=>{assert.equal(normalizeInvite(formatInvite('A1B2C3D4E5F67890')),'A1B2C3D4E5F67890');assert.equal(themeImage(999),themeAssets[0]);});
