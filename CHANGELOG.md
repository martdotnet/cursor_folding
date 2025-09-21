# Changelog

## **[1.0.0]** <small><small>(Updated: 08/30/2025)</small></small>

### Added

- Initial release of **Cursor Folding**
- Folding commands:
  - `Fold All`
  - `Unfold All`
  - `Fold Current Block`
  - `Unfold Current Block`
  - `Toggle Fold Current Block`
  - `Fold Level N`
  - `Fold All Upper Blocks`
  - `Fold All Deeper Blocks`
  - `Fold All Enclosing Deeper Blocks`
  - `Fold Same Indentation`
  - `Fold All Except Cursor`
  - `Fold Until Cursor`
  - `Fold Past Cursor`
  - `Fold Selection`
  - `Unfold Selection`
- Configurable settings:
  - `cursor-folding.ignoreParentOnFoldAllUpperBlocks`
  - `cursor-folding.ignoreChildFoldsOnFoldAllExceptCursor`
  - `cursor-folding.excludeCursorBlockOnFoldUntilCursor`
  - `cursor-folding.excludeCursorBlockOnFoldPastCursor`
  - `cursor-folding.onlyFoldSelectionsWhenFullyCapped`
- Default keybindings are added for these 15 commands. For details see README.md

## **[1.1.0]** <small><small>(Updated: 09/2/2025)</small></small>

### Added

- Configurable setting:
  - `cursor-folding.unfoldChildFoldsOnFoldAllExceptCursor`
    - When `true`, will unfold child blocks. Only possible when `cursor-folding.ignoreChildFoldsOnFoldAllExceptCursor` is set to `true`
- Files:
  - `commands.ts` : now contains all commands
  - `helpers.ts` : now contains helper functions used in commands.ts

### Fixed

- `calc_levels` failed on nested ranges because a range would only check if its exceeds the parent range once.

## **[1.1.1]** <small><small>(Updated: 09/21/2025)</small></small>

### Fixed

- Fixed `Fold Upper` command when `ignoreParentOnFoldAllUpperBlocks` is `true` where removing the current cursor range would try to get a fold index that is a level higher then the target fold.
- Fixed `Fold All Except Cursor` command where config would get the wrong configuration value, and added proper unfolding of children blocks when both `ignoreChildFoldsOnFoldAllExceptCursor` and `unfoldChildFoldsOnFoldAllExceptCursor` settings are true
