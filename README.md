Obsidian Web Clipper helps you highlight and capture the web in your favorite browser. Anything you save is stored as durable Markdown files that you can read offline, and preserve for the long term.

- **[Download Web Clipper](https://obsidian.md/clipper)**
- **[Documentation](https://help.obsidian.md/web-clipper)**
- **[Troubleshooting](https://help.obsidian.md/web-clipper/troubleshoot)**

## Get started

Install the extension by downloading it from the official directory for your browser:

- **[Chrome Web Store](https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf)** for Chrome, Brave, Arc, Orion, and other Chromium-based browsers.
- **[Firefox Add-Ons](https://addons.mozilla.org/en-US/firefox/addon/web-clipper-obsidian/)** for Firefox and Firefox Mobile.
- **[Safari Extensions](https://apps.apple.com/us/app/obsidian-web-clipper/id6720708363)** for macOS, iOS, and iPadOS.
- **[Edge Add-Ons](https://microsoftedge.microsoft.com/addons/detail/obsidian-web-clipper/eigdjhmgnaaeaonimdklocfekkaanfme)** for Microsoft Edge.

## Use the extension

Documentation is available on the [Obsidian Help site](https://help.obsidian.md/web-clipper), which covers how to use [highlighting](https://help.obsidian.md/web-clipper/highlight), [templates](https://help.obsidian.md/web-clipper/templates), [variables](https://help.obsidian.md/web-clipper/variables), [filters](https://help.obsidian.md/web-clipper/filters), and more.

## Command-line interface (CLI)

The same clipping engine is also available as a command-line tool. Give it a URL, and it fetches the page, extracts the main content, converts it to Markdown, and prints an Obsidian-ready note — identical to what the browser extension produces.

### Install

```
npm install -g @mejazbese21/obsidian-clipper-cli
```

This adds the `obsidian-clipper` command to your PATH.

### Quick start

```
obsidian-clipper https://example.com/article

# For example:
obsidian-clipper https://docs.equalsmoney.com/
```

That's it — with no template, a built-in **Clippings** template is used (title, source, author, dates, description, and a `clippings` tag). To customize the note, pass your own template with `-t`:

```
obsidian-clipper https://example.com/article -t template.json
```

A ready-to-use copy of the default template ships as [`template.json`](/template.json) — copy it, tweak the properties, and point `-t` at your own file. Run `obsidian-clipper --help` at any time for the full guide.

### Common uses

```
# Clip with the built-in default template
obsidian-clipper https://example.com/article

# Save to a file instead of printing
obsidian-clipper https://example.com/article -t template.json -o note.md

# Clip HTML you already saved (no network request); use "-" for stdin
obsidian-clipper https://example.com/article -t template.json --html page.html

# Send the note straight into an Obsidian vault
obsidian-clipper https://example.com/article -t template.json --open --vault "My Vault"

# Auto-match a template from a folder, by the URL it triggers on
obsidian-clipper https://example.com/article -t ./templates/
```

### Options

| Option | Description |
| --- | --- |
| `-t, --template <path>` | Template JSON file, or a directory of templates. Optional — when omitted, a built-in **Clippings** template is used. A directory auto-matches by URL triggers. |
| `-o, --output <path>` | Write the note to this `.md` file (default: stdout). |
| `--html <path>` | Use HTML from a file instead of fetching the URL (`-` reads stdin). |
| `--vault <name>` | Obsidian vault name (with `--open`). |
| `--open` | Send the note to Obsidian instead of printing it. |
| `--uri` | With `--open`, use the `obsidian://` URI scheme. |
| `--silent` | With `--uri`, don't steal focus from the terminal. |
| `--property-types <path>` | JSON mapping property names to types (`text`, `multitext`, `number`, `checkbox`, `date`, `datetime`). |
| `-h, --help` | Show the full usage guide. |

Templates, variables, and filters work exactly as they do in the extension — see the [templates](https://help.obsidian.md/web-clipper/templates), [variables](https://help.obsidian.md/web-clipper/variables), and [filters](https://help.obsidian.md/web-clipper/filters) docs.

### Build the CLI from source

```
npm run build:cli
```

This bundles the CLI to `dist/cli.cjs`.

## Contribute

### Translations

You can help translate Web Clipper into your language. Submit your translation via pull request using the format found in the [/_locales](/src/_locales) folder.

### Features and bug fixes

See the [help wanted](https://github.com/obsidianmd/obsidian-clipper/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tag for issues where contributions are welcome.

## Roadmap

In no particular order:

- [ ] Annotate highlights
- [ ] Template directory
- [ ] Sync settings across browsers
- [x] A separate icon for Web Clipper (1.6.3)
- [x] Template validation (1.1.0)
- [x] Template logic (if/for)  (1.1.0)
- [x] Save images locally ([Obsidian 1.8.0](https://obsidian.md/changelog/2024-12-18-desktop-v1.8.0/))
- [x] Translate UI into more languages — help is welcomed

## Developers

To build the extension:

```
npm run build
```

This will create three directories:
- `dist/` for the Chromium version
- `dist_firefox/` for the Firefox version
- `dist_safari/` for the Safari version

### Install the extension locally

For Chromium browsers, such as Chrome, Brave, Edge, and Arc:

1. Open your browser and navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist` directory

For Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to the `dist_firefox` directory and select the `manifest.json` file

If you want to run the extension permanently you can do so with the Nightly or Developer versions of Firefox.

1. Type `about:config` in the URL bar
2. In the Search box type `xpinstall.signatures.required`
3. Double-click the preference, or right-click and select "Toggle", to set it to `false`.
4. Go to `about:addons` > gear icon > **Install Add-on From File…**

For iOS Simulator testing on macOS:

1. Run `npm run build` to build the extension
2. Open `xcode/Obsidian Web Clipper/Obsidian Web Clipper.xcodeproj` in Xcode
3. Select the **Obsidian Web Clipper (iOS)** scheme from the scheme selector
4. Choose an iOS Simulator device and click **Run** to build and launch the app
5. Once the app is running on the simulator, open **Safari**
6. Navigate to a webpage and tap the **Extensions** button in Safari to access the Web Clipper extension

### Run tests

```
npm test
```

Or run in watch mode during development:

```
npm run test:watch
```

## Third-party libraries

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) for browser compatibility
- [defuddle](https://github.com/kepano/defuddle) for content extraction and Markdown conversion
- [dayjs](https://github.com/iamkun/dayjs) for date parsing and formatting
- [lz-string](https://github.com/pieroxy/lz-string) to compress templates to reduce storage space
- [lucide](https://github.com/lucide-icons/lucide) for icons
- [dompurify](https://github.com/cure53/DOMPurify) for sanitizing HTML

## License

Obsidian Web Clipper source code is open source under the MIT License. All trademarks, icons, marketing copy, and other marketing assets are excluded from that license.
