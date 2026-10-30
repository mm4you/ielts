import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import { exerciseContentSchema, EXERCISE_MODES } from '../lib/exercises';
import { localReviewedExercises } from '../fixtures/local-exercise-review';
import { LEVELS, TOPICS } from '../types';
const rowSchema=z.object({
  id:z.string().min(1).max(150),version:z.number().int().positive(),mode:z.enum(EXERCISE_MODES),wordId:z.number().int().positive(),
  topic:z.enum(TOPICS),level:z.enum(LEVELS),status:z.literal('reviewed'),content:exerciseContentSchema,
  sourceUrl:z.url(),usageRights:z.string().min(1),reviewedBy:z.string().min(1),reviewedAt:z.iso.datetime(),
  scope:z.enum(['local-test','publication']),
}).refine(q=>q.mode===q.content.kind);
const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw new Error('Usage: tsx scripts/prepare-exercise-questions.ts <reviewed.json|--local-test> <plan.json>');
const rows=input==='--local-test'?localReviewedExercises:JSON.parse(readFileSync(input,'utf8'));
const questions=z.array(rowSchema).min(1).parse(rows);
if(new Set(questions.map(q=>q.id)).size!==questions.length)throw new Error('Question IDs must be unique. Use a new ID for a new version.');
const localOnly=questions.some(q=>q.scope==='local-test');
if(localOnly&&!resolve(output).startsWith(resolve('.drafts')+sep))throw new Error('Local/test plans must stay inside .drafts and must not be published.');
writeFileSync(output,JSON.stringify({dryRun:true,localOnly,policy:'No database changes. Map wordIds and review destination/version before separately authorized import.',questions},null,2));
console.log('Prepared '+questions.length+' reviewed '+(localOnly?'local/test':'publication-candidate')+' questions; database unchanged.');
