# Cursor Folding

A VSCode extension that makes a quick and easy way to fold what you want relative to your cursor.

## All Commands
Here is a list of commands available with default keybinds. If you wish to customize keybinds, press `Ctrl + Shift + P` (open command list shortcut) and enter for `Preferences: Open Keyboard Shortcuts (UI)`. Using the keybind search, type `Cursor Folding` or `cursor-folding.` to see available keybinds and change them to whatever. 

**Note**: A lot of the commands use the `<grave>` key ```` ` ````; if you have trouble seeing the key, it's probably the grave key.


| Command Name                                  | Display Name                | Default Shortcut           | Description            |
|-----------------------------------------------|-----------------------------|----------------------------|------------------------|
| `cursor-folding.foldAll`                      | `Fold All`                  | ```` Ctrl+Alt+Shift+` ```` | Fold all blocks
| `cursor-folding.unfoldAll`                    | `Unfold All`                | ```` Ctrl+`           ```` | Unfold all blocks
| `cursor-folding.foldCurrentBlock`             | `Fold Current Block`        | ```` Alt+Shift+[      ```` | Folds the block the cursor is in
| `cursor-folding.unfoldCurrentBlock`           | `Unfold Current Block`      | ```` Alt+Shift+]      ```` | Unfolds the block the cursor is in
| `cursor-folding.toggleFoldCurrentBlock`       | `Toggle Fold Current Block` | ```` Alt+`            ```` | Toggles between folding and unfolding the current cursor block
| `cursor-folding.foldLevelN`                   | `Fold Level ...`            | ```` Ctrl+K Ctrl+0    ```` | Ask for a number from 1 - 9, then folds the level of that number
| `cursor-folding.foldAllUpperBlocks`           | `Fold All Upper Blocks`     | ```` Ctrl+Alt+\       ```` | Folds all blocks that are one level above the level the cursor is in
| `cursor-folding.foldAllDeeperBlocks`          | `Fold All Deeper Blocks`    | ```` Ctrl+Alt+\       ```` | Folds all blocks that are one level below the level the cursor is in
| `cursor-folding.foldAllEnclosingDeeperBlocks` | `Fold Scoped Deeper Blocks` | ```` Alt+Shift+\      ```` | Does the same thing as the command above, but constricts itself to the block the cursor is in
| `cursor-folding.foldSameIndent`               | `Fold Same Indentation`     | ```` Ctrl+Shift+`     ```` | Folds all blocks of the same level as the block the cursor is in
| `cursor-folding.foldAllExceptCursor`          | `Fold All Except Cursor`    | ```` Alt+F            ```` | Focuses the current scope by folding all other blocks
| `cursor-folding.foldUntilCursor`              | `Fold Until Cursor`         | ```` Ctrl+Alt+[       ```` | Folds all blocks above the cursor
| `cursor-folding.foldPastCursor`               | `Fold Past Cursor`          | ```` Ctrl+Alt+]       ```` | Folds all blocks below the cursor 
| `cursor-folding.foldSelection`                | `Fold Selection`            | ```` Alt+Shift+[      ```` | Folds the current selections. Can have the same keybind as `Fold Current Block`
| `cursor-folding.unfoldSelection`              | `Unfold Selection`          | ```` Alt+Shift+]      ```` | Unfolds the current selection. Can have the same keybind as `Unfold Current Block`


## Extension Settings

You can modify these properties by going to the extension page, pressing the gear icon, and selecting "Settings". Alternatively, you can set these settings in the `.vscode/settings.json` file for your workspace or user.

| Configuration Property (pre. `cursor-folding`) | Type      | Default Value | Description                                  |
|------------------------------------------------|-----------|---------------|----------------------------------------------|
| `.ignoreParentOnFoldAllUpperBlocks`            | `boolean` | `true` | When true and executing `cursor-folding.foldAllUpperBlocks`, do not fold the upper block that contains the cursor.
| `.ignoreChildFoldsOnFoldAllExceptCursor`       | `boolean` | `true` | When true and executing `cursor-folding.foldAllExceptCursor`, do not fold the child blocks containing the cursor.
| `.unfoldChildFoldsOnFoldAllExceptCursor`       | `boolean` | `true` | `cursor-folding.ignoreChildFoldsOnFoldAllExceptCursor` must be true. When true and executing cursor-folding.foldAllExceptCursor, unfolds the child blocks of the block containing the cursor.
| `.excludeCursorBlockOnFoldUntilCursor`         | `boolean` | `true` | When true and executing `cursor-folding.foldUntilCursor` and if the cursor is within a block, the block that contains the cursor is not folded.
| `.excludeCursorBlockOnFoldPastCursor`          | `boolean` | `true` | When true and executing `cursor-folding.foldPastCursor` and if the cursor is within a block, the block that contains the cursor is not folded.
| `.onlyFoldSelectionsWhenFullyCapped`           | `boolean` | `false` | If enabled, selection folding will only occur if selection fully captures both range's start and end lines. Otherwise, folding can occur if either range index meets the selection range.


## Known Issues

If you encounter an issue, and you don't see a similar header in the Issues tab, please open an issue. I will do my best to resolve them. Thank you!

## Release Notes

Release notes are available in CHANGELOG.md
