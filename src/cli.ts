// Browser globals (DOMParser, window, document) are provided by the esbuild
// banner in scripts/build-cli.mjs. They must run before any bundled module code.
import { parseHTML } from 'linkedom';
import { clip, matchTemplate, DocumentParser } from './api';
import { openInObsidian } from './utils/cli-utils';
import { Template } from './types/types';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
	url: string;
	templatePath?: string;
	outputPath?: string;
	vault?: string;
	open: boolean;
	silent: boolean;
	uri: boolean;
	propertyTypesPath?: string;
	htmlPath?: string;
}

function printUsage(): void {
	const usage = `
obsidian-clipper — clip a web page into an Obsidian-ready Markdown note.

Fetches a URL (or reads saved HTML), extracts the main content, converts it to
Markdown, and applies a template to produce a note with YAML frontmatter — the
same output as the Obsidian Web Clipper browser extension.

USAGE
  obsidian-clipper <url> [options]

ARGUMENTS
  <url>                        The page to clip (e.g. https://example.com/article)

OPTIONS
  -t, --template <path>        Template JSON file, or a directory of templates.
                               Optional — when omitted, a built-in "Clippings"
                               template is used. With a directory, the template
                               whose triggers match <url> is selected automatically.
  -o, --output <path>          Write the note to this .md file (default: stdout)
      --html <path>            Use HTML from a file instead of fetching <url>
                               (use "-" to read HTML from stdin)
      --vault <name>           Obsidian vault name (used with --open)
      --open                   Send the note to Obsidian instead of printing it
      --uri                    With --open, use the obsidian:// URI scheme
      --silent                 With --uri, don't steal focus from your terminal
      --property-types <path>  JSON object mapping property names to types
                               (text | multitext | number | checkbox | date | datetime)
  -h, --help                   Show this help

EXAMPLES
  # Print a clipped note using the built-in default template
  obsidian-clipper https://example.com/article

  # Print a clipped note with your own template
  obsidian-clipper https://example.com/article -t template.json

  # Save the note to a file
  obsidian-clipper https://example.com/article -t template.json -o note.md

  # Clip HTML you already saved (no network request)
  obsidian-clipper https://example.com/article -t template.json --html page.html

  # Pipe HTML in from another command
  curl -sL https://example.com/article | obsidian-clipper https://example.com/article -t template.json --html -

  # Send straight into an Obsidian vault
  obsidian-clipper https://example.com/article -t template.json --open --vault "My Vault"

  # Let a folder of templates auto-match by URL
  obsidian-clipper https://example.com/article -t ./templates/

TEMPLATES
  A template is a JSON file describing the note: its name, save path, body
  format, and frontmatter properties. Values use {{variables}} (e.g. {{title}},
  {{content}}, {{url}}, {{date}}) and |filters (e.g. {{author|split:", "}}).
  A ready-to-use default "Clippings" template ships as template.json — copy and
  edit it to make your own.

LEARN MORE
  Templates:  https://help.obsidian.md/web-clipper/templates
  Variables:  https://help.obsidian.md/web-clipper/variables
  Filters:    https://help.obsidian.md/web-clipper/filters
`.trim();
	console.log(usage);
}

function parseArgs(argv: string[]): CliArgs {
	const args = argv.slice(2);

	// No arguments at all: show the guide rather than an error.
	if (args.length === 0) {
		printUsage();
		process.exit(0);
	}

	let url = '';
	let templatePath = '';
	let outputPath: string | undefined;
	let vault: string | undefined;
	let open = false;
	let silent = false;
	let uri = false;
	let propertyTypesPath: string | undefined;
	let htmlPath: string | undefined;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case '-h':
			case '--help':
				printUsage();
				process.exit(0);
				break;
			case '-t':
			case '--template':
				if (i + 1 >= args.length) { console.error('Error: --template requires a value'); process.exit(1); }
				templatePath = args[++i];
				break;
			case '-o':
			case '--output':
				if (i + 1 >= args.length) { console.error('Error: --output requires a value'); process.exit(1); }
				outputPath = args[++i];
				break;
			case '--vault':
				if (i + 1 >= args.length) { console.error('Error: --vault requires a value'); process.exit(1); }
				vault = args[++i];
				break;
			case '--open':
				open = true;
				break;
			case '--silent':
				silent = true;
				break;
			case '--uri':
				uri = true;
				break;
			case '--html':
				if (i + 1 >= args.length) { console.error('Error: --html requires a value'); process.exit(1); }
				htmlPath = args[++i];
				break;
			case '--property-types':
				if (i + 1 >= args.length) { console.error('Error: --property-types requires a value'); process.exit(1); }
				propertyTypesPath = args[++i];
				break;
			default:
				if (!arg.startsWith('-') && !url) {
					url = arg;
				} else {
					console.error(`Unknown option: ${arg}`);
					printUsage();
					process.exit(1);
				}
		}
	}

	if (!url) {
		console.error('Error: URL is required');
		printUsage();
		process.exit(1);
	}

	return { url, templatePath: templatePath || undefined, outputPath, vault, open, silent, uri, propertyTypesPath, htmlPath };
}

// ---------------------------------------------------------------------------
// Template loading
// ---------------------------------------------------------------------------

// Built-in "Clippings" template used when -t/--template is omitted. Kept in
// sync with the repo's template.json. Embedded here (rather than read from
// disk) so it ships inside the npm bundle, which only publishes dist/.
const DEFAULT_TEMPLATE: Template = {
	schemaVersion: '0.1.0',
	name: 'Default',
	behavior: 'create',
	noteNameFormat: '{{title}}',
	path: 'Clippings',
	noteContentFormat: '{{content}}',
	properties: [
		{ name: 'title', value: '{{title}}', type: 'text' },
		{ name: 'source', value: '{{url}}', type: 'text' },
		{ name: 'author', value: '{{author|split:", "|wikilink|join}}', type: 'multitext' },
		{ name: 'published', value: '{{published}}', type: 'date' },
		{ name: 'created', value: '{{date}}', type: 'date' },
		{ name: 'description', value: '{{description}}', type: 'text' },
		{ name: 'tags', value: 'clippings', type: 'multitext' },
	],
	triggers: [],
} as unknown as Template;

const templateFilePaths = new Map<Template, string>();

function loadTemplatesFromDir(dirPath: string): Template[] {
	const resolved = path.resolve(dirPath);
	const files = fs.readdirSync(resolved).filter(f => f.endsWith('.json'));
	return files.map(f => {
		const raw = fs.readFileSync(path.join(resolved, f), 'utf-8');
		const template: Template = JSON.parse(raw);
		templateFilePaths.set(template, path.join(resolved, f));
		return template;
	});
}

// ---------------------------------------------------------------------------
// linkedom-based DocumentParser for the API
// ---------------------------------------------------------------------------

const linkedomParser: DocumentParser = {
	parseFromString(html: string, _mimeType: string) {
		return parseHTML(html).document;
	}
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const args = parseArgs(process.argv);

	let templates: Template[] | undefined;
	let template: Template | undefined;

	if (!args.templatePath) {
		// No template supplied: fall back to the built-in "Clippings" template.
		template = DEFAULT_TEMPLATE;
	} else {
		// Determine if template path is a file or directory
		const resolvedTemplatePath = path.resolve(args.templatePath);
		const isDir = fs.statSync(resolvedTemplatePath).isDirectory();

		if (isDir) {
			templates = loadTemplatesFromDir(resolvedTemplatePath);
			if (templates.length === 0) {
				console.error(`Error: No .json template files found in ${args.templatePath}`);
				process.exit(1);
			}
		} else {
			const templateRaw = fs.readFileSync(resolvedTemplatePath, 'utf-8');
			template = JSON.parse(templateRaw);
		}
	}

	// Load optional property types
	let propertyTypes: Record<string, string> | undefined;
	if (args.propertyTypesPath) {
		const raw = fs.readFileSync(path.resolve(args.propertyTypesPath), 'utf-8');
		propertyTypes = JSON.parse(raw);
	}

	// Get HTML: from file/stdin (--html) or by fetching URL
	let html: string;
	if (args.htmlPath) {
		if (args.htmlPath === '-') {
			html = fs.readFileSync(0, 'utf-8'); // stdin
		} else {
			html = fs.readFileSync(path.resolve(args.htmlPath), 'utf-8');
		}
	} else {
		const response = await fetch(args.url);
		if (!response.ok) {
			console.error(`Failed to fetch ${args.url}: ${response.status} ${response.statusText}`);
			process.exit(1);
		}
		html = await response.text();
	}

	// If using a template directory, match template by triggers.
	// Try URL triggers first (no parsing needed). Only parse for schema if required.
	let parsedDocument: any;
	if (templates) {
		// First try URL-only matching (no HTML parsing needed)
		let matched = matchTemplate(templates, args.url);

		// If no URL match, check if any templates have schema triggers
		if (!matched) {
			const hasSchemaTrigs = templates.some(t => t.triggers?.some(tr => tr.startsWith('schema:')));
			if (hasSchemaTrigs) {
				const DefuddleClass = (await import('defuddle')).default;
				parsedDocument = linkedomParser.parseFromString(html, 'text/html');
				const defuddle = new DefuddleClass(parsedDocument as unknown as Document, { url: args.url });
				const defuddleResult = defuddle.parse();
				matched = matchTemplate(templates, args.url, defuddleResult.schemaOrgData);
			}
		}

		if (!matched) {
			console.error(`Error: No template matched URL ${args.url}`);
			console.error(`Searched ${templates.length} templates in ${args.templatePath}`);
			process.exit(1);
		}
		template = matched;
		console.error(`Matched template: ${templateFilePaths.get(template) || 'unknown'}`);
	}

	if (!template) {
		console.error('Error: No template resolved');
		process.exit(1);
	}

	// Call the API (reuse pre-parsed document if available)
	const result = await clip({
		html,
		url: args.url,
		template,
		documentParser: linkedomParser,
		propertyTypes,
		parsedDocument,
	});

	// Output
	if (args.open) {
		const vault = args.vault || template.vault || '';
		const obsResult = await openInObsidian(
			result.fullContent,
			result.noteName,
			template.path || '',
			vault,
			template.behavior || 'create',
			args.silent,
			args.uri
		);
		console.error(obsResult);
	} else if (args.outputPath) {
		fs.writeFileSync(path.resolve(args.outputPath), result.fullContent, 'utf-8');
		console.error(`Written to ${args.outputPath}`);
	} else {
		process.stdout.write(result.fullContent);
	}
}

main().then(
	() => {
		// Node's built-in fetch (undici) holds sockets open in a keep-alive
		// pool, which keeps the event loop alive for several seconds after the
		// work is done. Exit explicitly so the CLI returns to the prompt
		// immediately instead of appearing to hang until the user presses Enter.
		process.exitCode = 0;
		// Flush stdout before exiting so piped/redirected output isn't truncated.
		if (process.stdout.writableLength === 0) {
			process.exit(0);
		} else {
			process.stdout.once('drain', () => process.exit(0));
		}
	},
	err => {
		console.error(err.message || err);
		process.exit(1);
	}
);
