# Putting "Translator App for CY" on your iPhone 🎁

This app reads Chinese / Japanese / Korean text through your camera and translates
it live. Because Apple requires a Mac to build iPhone apps, you'll build it once on
your Mac and it installs straight onto your phone. It's free — the only catch is a
free Apple ID signature lasts **7 days**, so you re-run one command to refresh it
(see the end).

## What you need (one-time)

- A **Mac** with **Xcode** installed — free from the Mac App Store (it's a big
  download, ~7 GB, so start it first).
- **Node.js** (LTS) — from <https://nodejs.org> or `brew install node`.
- Your **iPhone** + its cable, and any **Apple ID** (your normal one is fine).
- The **translation key** — the person who set this up will send you a short key
  starting with `AIza…`.

## Build & install

Open **Terminal** and run these, one block at a time:

```bash
# 1. Get the project
git clone https://github.com/MrBigroom/AR-Translator-2.git
cd AR-Translator-2

# 2. Install dependencies
npm install

# 3. Add the translation key (paste the real key in place of AIza...THEKEY)
printf 'GIFT_CLOUD_TRANSLATE_API_KEY=AIza...THEKEY\nGIFT_CLOUD_TRANSLATE_PROVIDER=google\n' > .env
```

4. **Plug your iPhone into the Mac** and unlock it. If it asks *"Trust This
   Computer?"*, tap **Trust**.

5. **Set up signing (first time only):** run `npx expo prebuild -p ios`, then open
   the generated **`ios/giftforcy.xcworkspace`** in Xcode. Click the **giftforcy**
   project → **Signing & Capabilities** → tick **Automatically manage signing** →
   pick your **Team** (choose *Add an Account…* and sign in with your Apple ID).
   - If it complains the bundle ID `com.giftforcy.app` is taken, just change it (in
     that same screen, or in `app.config.ts`) to something unique like
     `com.<yourname>.giftforcy`.

6. **Build it onto your phone** (this makes a standalone app that works offline):

   ```bash
   npx expo run:ios --configuration Release --device
   ```
   Pick your iPhone if it asks. First build takes ~10–15 min (it compiles the
   camera/ML libraries).

7. On the iPhone, if it says *"Untrusted Developer"*: **Settings → General → VPN &
   Device Management → tap your Apple ID → Trust**.

8. Open **Translator App for CY**, allow the camera, and point it at some text. 🎉
   Tap the language chip (bottom-left) to switch Chinese / Japanese / Korean; drag
   or resize the green box to aim it at the text you want.

## Refreshing every ~7 days

The free signature expires after a week and the app stops opening. To refresh,
just plug in the phone and re-run:

```bash
npx expo run:ios --configuration Release --device
```

It takes a couple minutes. (If you'd rather never do this, a paid Apple Developer
account, $99/yr, lets it be installed for 90 days at a time via TestFlight.)

## If a build fails

iOS builds sometimes need a small config tweak. Copy the **red error text** from
Terminal and send it over — these are usually quick one-line fixes.
