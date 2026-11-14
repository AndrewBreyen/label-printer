# Label Printer for Marklife P50S Printer

This package provides a simple Web app to print labels using the MarkLife P50S label printer.

It is a simple Web app that uses the MarkLife P50S label printer to print labels.

It is a work in progress, and the app is not yet complete.

The app is currently set up to print labels of a specific size, but the size can be changed by editing the `labelTemplates` object in `src/labelTemplates.js`

## Usage

!> **Note**: You MUST use Chrome to be able to connect to the printer.

1. Clone the repository
2. Install the dependencies (in the `label-printer` folder):
    - `npm install`
3. Run `npm start` to start the app

Alternatively, run `./launch.sh` to install/update the dependencies and start the app in Google Chrome. If Chrome is already running, macOS reuses that app. Pass `--quick` to skip dependency installation and start immediately:

```sh
./launch.sh
./launch.sh --quick
```

The **Text (15mm Continuous)** mode uses the same markdown formatting as Manual mode. Choose
rotated text (along the tape) or normal, unrotated text. Start alignment places the text at the
beginning of the label without adding blank lines. Set a minimum label length in millimeters;
the label grows automatically when the content needs more room. The preview updates as you edit
the text or its settings.

The **58mm Receipt** mode uses the Manual mode markdown editor and prints on continuous receipt
paper at the printer's full 384-dot image width. The receipt length adjusts to the markdown
content.

The **Image (58mm Continuous)** mode accepts PNG, JPEG, WebP, and GIF images. Images are converted
to dithered black and white, scaled to the printer's full 384-dot width with their aspect ratio
preserved, then printed on continuous roll paper. Use the **Lighten image** slider to add
brightness before dithering; increasing it reduces the amount of black ink in the print. The
preview reflects the current setting.

## Attributions

This web app uses the following libraries:

- [marklife-label-printer-web-kit](https://gitlab.com/marklife/marklife-label-printer-web-kit)