import assert from 'node:assert/strict';
import { TypingAudio } from '../lib/typing-audio';
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ connect(target: unknown) { return target; }, disconnect() {} });
const sources: { stopped: boolean; ended: (() => void) | null; finish(): void }[] = [];
let factories = 0, closed = 0;
const context = {
  state: 'running', sampleRate: 48000, currentTime: 0, destination: {},
  createGain: () => ({ ...node(), gain: param() }),
  createBiquadFilter: () => ({ ...node(), frequency: param(), Q: param(), type: '' }),
  createBuffer: (_channels: number, size: number) => ({ getChannelData: () => new Float32Array(size) }),
  createBufferSource: () => {
    const record = { stopped: false, ended: null as (() => void) | null, finish() { this.ended?.(); } };
    sources.push(record);
    return { ...node(), buffer: null, playbackRate: param(), start() {}, stop(at?: number) { if (at === undefined) { record.stopped = true; record.finish(); } }, set onended(callback: () => void) { record.ended = callback; } };
  },
  async resume() {}, async close() { closed++; },
};
async function main() {
  const audio = new TypingAudio(() => { factories++; return context as unknown as AudioContext; });
  await audio.unlock(); await audio.unlock();
  assert.equal(factories, 1);
  for (let i = 0; i < 30; i++) audio.play('key');
  assert.equal(sources.length, 12, 'Rapid input must not create unlimited voices');
  sources[0].finish(); sources[1].finish();
  audio.play('destroy');
  assert.equal(sources.length, 14, 'Ended voices release capacity');
  audio.setEnabled(false);
  const before = sources.length;
  audio.play('damage');
  assert.equal(sources.length, before);
  assert(sources.every(source => source.stopped || source === sources[0] || source === sources[1]));
  audio.setEnabled(true); audio.play('damage');
  assert.equal(sources.length, before + 2);
  audio.dispose(); await audio.unlock();
  assert.equal(closed, 1); assert.equal(factories, 1);
  console.log('Typing audio: one context, bounded voices, mute, voice cleanup and disposal passed.');
}
void main();
