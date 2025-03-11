// Polyfills para o Firebase e outras bibliotecas que dependem de módulos Node.js
import { Buffer } from 'buffer';

// Adicionar Buffer ao objeto global
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window as any;
  window.process = { env: {} } as any;
} 