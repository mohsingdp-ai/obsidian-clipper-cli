# Obsidian Web Clipper CLI

Clip web pages to Obsidian-ready Markdown from terminal.

## Install

```bash
npm install -g @mejazbese21/obsidian-clipper-cli
```

## Usage

```bash
obsidian-clipper <url>
```

Example:

```bash
obsidian-clipper https://docs.equalsmoney.com/
```

Default template used if no template given.

## Custom template

```bash
obsidian-clipper https://example.com/article -t template.json
```

## Save to file

```bash
obsidian-clipper https://example.com/article -o note.md
```

## Use saved HTML

```bash
obsidian-clipper https://example.com/article --html page.html
```

Use stdin:

```bash
cat page.html | obsidian-clipper https://example.com/article --html -
```

## Open in Obsidian

```bash
obsidian-clipper https://example.com/article --open --vault "My Vault"
```

## Template folder auto-match

```bash
obsidian-clipper https://example.com/article -t ./templates/
```

## Options

| Option             | Use                   |
| ------------------ | --------------------- |
| `-t, --template`   | template file/folder  |
| `-o, --output`     | save markdown file    |
| `--html`           | use local HTML        |
| `--vault`          | Obsidian vault name   |
| `--open`           | send to Obsidian      |
| `--uri`            | use obsidian:// URI   |
| `--silent`         | don’t focus Obsidian  |
| `--property-types` | property type mapping |
| `-h, --help`       | help                  |

## Build

```bash
npm run build:cli
```

Output:

```bash
dist/cli.cjs
```

## Dev

Build extension:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Watch tests:

```bash
npm run test:watch
```

## Links

* GitHub: https://github.com/mohsingdp-ai/obsidian-clipper-cli
* Download: https://obsidian.md/clipper
* Docs: https://help.obsidian.md/web-clipper
* Troubleshoot: https://help.obsidian.md/web-clipper/troubleshoot

## License

MIT, except Obsidian trademarks/icons/marketing assets.
