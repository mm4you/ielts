export function getNvidiaModel(): string {
  return process.env.NVIDIA_MODEL?.trim() || 'nvidia/nemotron-3.5-bolt-e4b';
}
