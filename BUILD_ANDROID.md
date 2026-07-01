# Building "Gift for CY" — Android (standalone APK)

This produces a **standalone Android app** — the JS bundle and the cloud key are
baked in, so it runs with no computer, no Metro, on any network. Unlike the iOS
free-signing route, an Android debug-signed release **does not expire**.

## What you need (one-time)

- **Node.js** (LTS) — <https://nodejs.org>.
- **Android SDK + a JDK** — easiest is to install **Android Studio** (bundles both),
  then set `ANDROID_HOME` (usually `~/Android/Sdk`).
- The **translation key** (same one the iOS build uses).
- Optional: an Android phone with **USB debugging** on (to install directly).

## Option A — build & install straight to a connected phone

```bash
git clone https://github.com/MrBigroom/AR-Translator-2.git
cd AR-Translator-2
npm install

# Add the cloud key (paste the real key in place of AIza...THEKEY)
printf 'GIFT_CLOUD_TRANSLATE_API_KEY=AIza...THEKEY\nGIFT_CLOUD_TRANSLATE_PROVIDER=google\n' > .env

# Plug in the phone (accept the "Allow USB debugging?" prompt), then:
npx expo run:android --variant release
```

That builds the release variant, installs it, and launches it. It's a real
standalone app from then on.

## Option B — just build the APK (to share / sideload)

```bash
npx expo prebuild -p android      # only if the android/ folder isn't there yet
cd android && ./gradlew assembleRelease
# APK lands at: android/app/build/outputs/apk/release/app-release.apk
```

Install it with `adb install -r app-release.apk`, or copy the `.apk` to the phone
and tap it (enable "Install unknown apps" for your file manager/browser first).

## Smaller APK (optional)

The default is a **universal** APK (~136 MB — includes every CPU type). For a
smaller, arm64-only build (~40 MB, fits any modern phone):

```bash
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

## Notes

- Needs the same **`.env`** cloud key as the iOS build (it's git-ignored, so it's
  never committed — add it locally).
- Debug-signed release **doesn't expire**; reinstall only when you want to update.
- If a build fails, copy the red error text — most are quick config fixes.
