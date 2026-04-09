# Fix: VAD ONNX Runtime Loading

## Problem
`@ricky0123/vad-web` fails to load because ONNX WASM files and the Silero model aren't accessible from the Astro dev server.

## Fix

In `src/lib/vadService.ts`, configure VAD to load ONNX and model from CDN:

```typescript
import { MicVAD } from '@ricky0123/vad-web';

// Inside the start() method, pass CDN paths:
this.vad = await MicVAD.new({
  onSpeechStart: callbacks.onSpeechStart,
  onSpeechEnd: (audio) => callbacks.onSpeechEnd(audio),
  onVADMisfire: callbacks.onVADMisfire,
  positiveSpeechThreshold: 0.8,
  negativeSpeechThreshold: 0.3,
  redemptionFrames: 8,
  minSpeechFrames: 3,
  // CDN paths — avoids WASM/model serving issues with Astro
  onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/',
  modelURL: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.19/dist/silero_vad_legacy.onnx',
});
```

**Note:** Check the actual installed version numbers in `node_modules/@ricky0123/vad-web/package.json` and `node_modules/onnxruntime-web/package.json` and use matching CDN versions.

## That's it
One file change. No other files affected. After this fix, VAD should load and start listening when voice mode activates.