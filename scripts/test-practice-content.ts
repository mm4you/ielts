import assert from 'node:assert/strict';
import { maskPracticeText, practiceAnswers, reviewedPracticeSense } from '../lib/practice-content';
const review={status:'reviewed',sourceUrl:'https://example.invalid/review',reviewedBy:'local-reviewer',reviewedAt:new Date(),acceptedAnswers:['organisation'],senses:[{recallAnswers:['institution']}]};
assert.deepEqual(practiceAnswers('organization','spelling-bee',review),['organization','organisation']);
assert.deepEqual(practiceAnswers('organization','word-rain',review),['organization','institution']);
assert.deepEqual(practiceAnswers('organization','word-rain',{...review,status:'draft'}),['organization']);
assert.equal(maskPracticeText('The learner’s book is here.',["LEARNER’S BOOK"]),'The ___ is here.');
assert.equal(maskPracticeText('We make   a decision.',['make a decision']),'We ___.');
assert.equal(maskPracticeText('C++ and (test).',['C++','(test)']),'C++ and (test).'); // word boundaries do not mask punctuation-only forms
assert.equal(maskPracticeText('Research and researcher.',['research']),'___ and researcher.');
assert.equal(maskPracticeText('An organisation is an institution.',['organisation','institution']),'An ___ is an ___.');
const school={...review,senses:[{definitionEn:'a place where children receive lessons',meaningVi:'trường học',exampleEn:'The school has a library.',exampleVi:'Trường có một thư viện.',ipa:'/skuːl/',pos:'noun',collocations:[],wordFamily:[],commonErrors:[]}]};
assert.equal(reviewedPracticeSense(school)?.meaningVi,'trường học');
assert.equal(reviewedPracticeSense(school)?.ipa,'/skuːl/');
assert.equal(reviewedPracticeSense({...school,status:'draft'}),null);
console.log('Practice content: mode-specific alternatives and answer masking passed.');
