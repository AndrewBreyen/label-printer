# Label Printer for Marklife P50S Printer

This package provides a simple Web app to print labels using the MarkLife P50S label printer.

It is a simple Web app that uses the MarkLife P50S label printer to print labels.

It is a work in progress, and the app is not yet complete.

The app is currently set up to print labels of a specific size, but the size can be changed by editing the `labelTemplates` object in `src/labelTemplates.js`

## Usage

!> **Web printing** requires a browser with Web Bluetooth, such as desktop Chrome or Chrome for Android.

1. Clone the repository
2. Install the dependencies (in the `label-printer` folder):
    - `npm install`
3. Run `npm start` for local HTTP development, or use `./launch.sh` to start the HTTPS server
   accessible to devices on the local Wi-Fi network.

`launch.sh` installs/updates dependencies, creates a local certificate with mkcert, and opens
the app in Google Chrome. Install mkcert first (`brew install mkcert`). If Chrome is already
running, macOS reuses that app. Pass `--quick` to skip dependency installation:

```sh
./launch.sh
./launch.sh --quick
```

### Use from Android over local HTTPS

The development server started by `./launch.sh` can be reached from a phone on the same Wi-Fi
network. HTTPS is required for Web Bluetooth. The script creates a local certificate for the
Mac's Wi-Fi IP address and prints the URL and mkcert CA location.

To start the server without the launcher, first install [mkcert](https://github.com/FiloSottile/mkcert)
and create a certificate for the current Wi-Fi IP (`ipconfig getifaddr en0`):

```sh
mkdir -p .cert
mkcert -install
mkcert -cert-file .cert/lan-cert.pem -key-file .cert/lan-key.pem "$(ipconfig getifaddr en0)" localhost 127.0.0.1
npm run start:lan-https
```

On Android, install mkcert's `rootCA.pem` as a CA certificate. Its location is printed by
`mkcert -CAROOT`; transfer only `rootCA.pem` to the phone, never `rootCA-key.pem`. In Android
Security settings, choose **Install a certificate** / **CA certificate** (the exact labels vary
by Android version). Then open the URL printed by the launcher in Chrome. Keep the phone and Mac
on the same Wi-Fi network. The `.cert` directory contains local credentials and is excluded from
Git.

The app's workflow is grouped by stock size: **Small labels** has a custom editor with built-in
and saved templates, plus **Prep label**; **58 mm continuous** has **Receipt** and **Image**;
**15 mm continuous** has **Text** and **Barcode**. The live preview sits beside the settings on
desktop and above them on mobile.

The **Text** workflow supports markdown, rotated text along the tape or normal text across it,
start/center/end alignment, and a minimum length. Labels grow automatically when the content
needs more room.

Markdown-based workflows also include sans-serif, serif, and monospace fonts; small, standard,
and large text sizing; and an adjustable 0–5 mm margin slider with a **No margins** shortcut.
Markdown headings retain their relative sizes, and saved templates remember their typography and
margin settings. Receipt mode defaults to monospace.

The **Barcode** workflow encodes Code 128 values on 15 mm continuous tape.

The **Receipt** workflow prints markdown on continuous receipt paper at the printer's full
384-dot image width. The receipt length adjusts to its content.

The **Image (58mm Continuous)** mode accepts PNG, JPEG, WebP, and GIF images. Images are converted
to dithered black and white, scaled to the printer's full 384-dot width with their aspect ratio
preserved, then printed on continuous roll paper. Use the **Lighten image** slider to add
brightness before dithering; increasing it reduces the amount of black ink in the print. The
preview reflects the current setting.

## Install on an iPhone

The iOS app bundles the label editor locally and connects to the MarkLife P50S using native Bluetooth Low Energy. It requires iOS 15 or later. Building it requires a Mac with Xcode 26 or later and Node.js 22 or later.

Run `npm ci` once. Find your paired iPhone with `xcrun devicectl list devices` and put your IDs in the Git-ignored `.env.ios.local` file:

```sh
IOS_DEVELOPMENT_TEAM=YOUR_TEAM_ID
IOS_DEVICE_ID=YOUR_DEVICE_ID
```

Run `./build-ios.sh` to build, sign, and install. Export either variable or pass a device as an argument to override the local file.

To build and install through Xcode instead:

1. Run `npm ci`, then `npm run ios:sync` to build the web assets and sync them to the Xcode project.
2. Run `npm run ios:open`. In Xcode, choose the **App** target and select your team under **Signing & Capabilities**. A free Apple account works for personal device testing.
3. Connect and unlock your iPhone, select it as the run destination, and press **Run**. Enable Developer Mode if the iPhone prompts you.
4. Open **Label Printer**, tap **Connect Printer**, grant Bluetooth access, and select your P50S. Print a small label to verify the connection.

Run `npm run ios:sync` again before rebuilding in Xcode after changes to the React app. The hosted build still uses `npm run build`.

## Attributions

This web app uses the following libraries:

- [marklife-label-printer-web-kit](https://gitlab.com/marklife/marklife-label-printer-web-kit)
