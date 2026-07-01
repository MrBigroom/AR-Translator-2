# Gift for CY

A cross-platform (iOS + Android) **real-time AR translator**. Point the camera at
text and it is recognized and translated continuously from the live stream — no
shutter press, like Google Lens' live translation.

The screen is split as specified:

- **Top ~75%** — the live camera "AR scene" that continuously reads text.
- **Bottom ~25%** — a panel showing the recognized text and its translation, updating in real time.

Built with **Expo + React Native + TypeScript**, using **Google ML Kit** on-device
for OCR, translation, and language detection, with an optional cloud path.

## Features

- Live, continuous OCR from the camera (throttled, on the camera thread).
- **Hybrid translation engine**: on-device ML Kit by default (free, private, offline);
  optional Google Cloud Translation / DeepL when online, with automatic fallback.
- **Any → any**, primarily **any → English**. Source auto-detected; searchable
  source/target language pickers with a swap button.
- Freeze/resume, copy-to-clipboard, engine toggle, and a settings screen.
- First-use language models download automatically (~30MB each), then work offline.

## How it works

```
Camera frame ─▶ useFrameOcr (worklet, throttled)         src/hooks/useFrameOcr.ts
             ─▶ TextStabilizer (dedup/change gate)        src/lib/textStabilizer.ts
             ─▶ detectLanguage (auto mode)                src/services/languageId.ts
             ─▶ runTranslation (hybrid + fallback)        src/services/translationEngine.ts
                  ├─ on-device ML Kit                      src/services/onDeviceTranslate.ts
                  └─ cloud (Google / DeepL)                src/services/cloudTranslate.ts
             ─▶ TranslationPanel (bottom 25%)              src/components/TranslationPanel.tsx
```

The stabilizer only forwards text to the translator when it changes meaningfully,
so we don't re-translate identical frames or flicker on OCR jitter.

## Project layout

```
app.config.ts        # "Gift for CY" app config, camera perms, vision-camera plugin
eas.json             # EAS build profiles (development / preview / production)
babel.config.js      # worklets plugin (required by the frame processor)
src/
  App.tsx
  screens/           # TranslatorScreen (main), SettingsScreen
  components/        # CameraView, TranslationPanel, LanguageSelector
  hooks/             # useFrameOcr, useTranslation, useOnlineStatus
  services/          # translationEngine (pure), onDeviceTranslate, cloudTranslate, languageId
  lib/               # textStabilizer, throttle  (pure, unit-tested)
  store/             # settingsStore (zustand)
  config/            # languages, env
  theme/
__tests__/           # jest tests for the pure logic
```

## Prerequisites

- Node 18+ and npm
- A **physical Android or iOS device** (emulators/simulators have no real camera)
- For iOS builds without a Mac, an [Expo EAS](https://expo.dev) account

> **Important:** this app uses camera frame processors, which require native code.
> It runs in an **Expo dev client**, *not* Expo Go.

## Setup & run

```bash
npm install

# Generate native projects (android/ and ios/)
npx expo prebuild

# Build & install a dev client on a connected device, then start the bundler:
npm run android      # or: npm run ios   (needs macOS)
npm start            # if the dev client is already installed
```

### Building with EAS (recommended, no local native tooling needed)

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android   # or ios
# Install the resulting build on your device, then: npm start
```

## Optional cloud translation

On-device translation needs no configuration. To enable the higher-quality cloud
engine, copy `.env.example` to `.env` and set:

```bash
GIFT_CLOUD_TRANSLATE_API_KEY=your_key
GIFT_CLOUD_TRANSLATE_PROVIDER=google   # or "deepl"
```

When a key is present, a **Cloud** toggle appears (panel + Settings). If a cloud
request fails or the device is offline, the app falls back to on-device automatically.

> **Security:** an API key embedded in a mobile binary can be extracted. For
> anything beyond personal use, put a small serverless proxy in front of the
> provider and point the app at that proxy instead of shipping the raw key.

## Testing

The framework-independent logic (stabilizer, throttle, engine dispatch/fallback)
is unit-tested and runs headlessly:

```bash
npm test         # jest
npm run typecheck # tsc --noEmit  (after npm install)
```

Full end-to-end verification is manual, on a device:

1. Launch → grant camera permission → camera fills the top ~75%, panel the bottom ~25%.
2. Point at printed/on-screen foreign text → within ~1s the panel shows the original
   and its English translation, updating as you pan to new text.
3. Try ≥2 source languages (auto-detect), change the target, toggle On-device/Cloud,
   and test **Freeze** and **Copy**.
4. After models download, enable airplane mode — on-device translation still works.

## Known limitations & notes

- **Split-panel, not in-scene overlay.** Translated text appears in the bottom
  panel rather than being painted over the source text in 3D. True in-scene AR
  overlay (perspective tracking) is a possible future enhancement; ML Kit returns
  block bounding boxes that could drive it.
- **First use needs a network** to download each language model (~30MB); offline
  thereafter.
- **OCR plugin seam.** Live OCR is isolated in `src/hooks/useFrameOcr.ts`. If
  `react-native-vision-camera-ocr-plus` is ever unmaintained, only that file needs
  to change (alternatives: `react-native-vision-camera-mlkit`,
  `@react-native-ml-kit/text-recognition`).
