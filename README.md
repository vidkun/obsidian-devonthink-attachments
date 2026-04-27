# DEVONthink Attachments for Obsidian

Route pasted and dropped images/PDFs into DEVONthink and insert clickable links in your notes.

## Status

This is an early macOS-only plugin implementation. It supports:

- Image/PDF paste interception.
- Image/PDF drag-and-drop interception.
- DEVONthink import via JXA and `osascript`.
- Configurable database, group path, naming, tags, and link templates.
- Frontmatter opt-out with `dt-paste: false`.
- Optional Obsidian source-note URL metadata on imported DEVONthink records.
- Configurable DEVONthink links that either open the item directly or open its containing group.
- Optional fallback to normal Obsidian vault attachments when DEVONthink import fails.

## DEVONthink Compatibility

This plugin is tested with DEVONthink 3. DEVONthink 4 should be plausible because the import path is configurable and DEVONthink's automation APIs are broadly similar, but it is not verified here.

For DEVONthink 4, open the plugin settings and change **DEVONthink app name** from `DEVONthink 3` to `DEVONthink`.

## Setup

1. Build the plugin with `npm run build`.
2. Copy `main.js`, `manifest.json`, and `styles.css` into an Obsidian plugin folder.
3. Enable the plugin in Obsidian.
4. Open the plugin settings and choose a DEVONthink database/group.

On first use macOS may ask for Automation permission. If import fails with an authorization notice, open **System Settings -> Privacy & Security -> Automation**, find **Obsidian**, and enable DEVONthink.

## Settings

Templates support these variables:

- `${name}`
- `${uuid}`
- `${url}`
- `${database}`
- `${location}`
- `${ext}`
- `${date}`
- `${time}`
- `${note}`
- `${original}`

The default link templates use visible text links because Obsidian cannot preview `x-devonthink-item://` URLs inline.

## Known Limitations

- Only images and PDFs are handled.
- DEVONthink import is serial, by design.
- The "Open containing group" link behavior reuses an existing DEVONthink viewer window when possible, but does not reliably select the imported item. DEVONthink's URL and scripting selection behavior is inconsistent here.
- Undoing a paste in Obsidian does not remove the imported item from DEVONthink.

## Releasing

Obsidian community releases require GitHub release assets named exactly:

- `main.js`
- `manifest.json`
- `styles.css`

To build those locally:

```bash
npm run package
```

Create a GitHub release whose tag matches `manifest.json`, then upload the files from `dist/` as release assets.

With GitHub CLI:

```bash
gh release create 0.1.4 dist/main.js dist/manifest.json dist/styles.css --title "0.1.4" --notes "Initial release"
```
