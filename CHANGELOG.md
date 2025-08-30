# Changelog

## **[1.0.0]** <small><small>(Updated: 08/30/2025)</small></small>
### Added
- Initial release of  **Cursor Folding**
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
- Default keybindings are added for these 15 commands. For details see [README.md](README.md).
