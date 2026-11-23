import test from 'node:test';
import assert from 'node:assert/strict';
import {gameMode,canShareRound,contributed,isGuestName} from '../src/lib/game.js';
test('all three modes have distinct behavior',()=>{assert.equal(gameMode(1),'solo');assert.equal(gameMode(2),'duo');assert.equal(gameMode(3),'trio')});
test('only submitted artists determine share permissions',()=>{
 const round={submissions:[{user_id:'a'},{user_id:'b'}],consents:[{user_id:'a',approved:true},{user_id:'b',approved:false}]};
 assert.equal(canShareRound(round),false);
 round.consents[1].approved=true;assert.equal(canShareRound(round),true);
 round.submissions.push({user_id:'c'});assert.equal(canShareRound(round),false);
 assert.equal(canShareRound({submissions:[],consents:[]}),false);
});
test('contribution and guest name helpers',()=>{
 assert.equal(contributed({submissions:[{user_id:'a'}]},'a'),true);
 assert.equal(contributed({submissions:[{user_id:'a'}]},'b'),false);
 assert.equal(isGuestName('Artist abc123'),true);
 assert.equal(isGuestName('Morgan'),false);
});
