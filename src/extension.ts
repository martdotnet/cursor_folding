import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('cursor-folding');
  // not elegant but its ok
  const foldLevelList = [
    { label: '1', description: 'Fold the 1st level' },
    { label: '2', description: 'Fold the 2nd level' },
    { label: '3', description: 'Fold the 3rd level' },
    { label: '4', description: 'Fold the 4th level' },
    { label: '5', description: 'Fold the 5th level' },
    { label: '6', description: 'Fold the 6th level' },
    { label: '7', description: 'Fold the 7th level' },
    { label: '8', description: 'Fold the 8th level' },
    { label: '9', description: 'Fold the 9th level' }
  ];

  /// Base editor functions transfered to this extension

  // folds just the first level
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldAll', async () => {
    await vscode.commands.executeCommand('editor.foldAll');
  }));
  // unfolds everything
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.unfoldAll', async () => {
    await vscode.commands.executeCommand('editor.unfoldAll');
  }));
  // fold only the block which has the cursor
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldCurrentBlock', async () => {
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up' });
  }));
  // unfold only the block which has the cursor
  // the cursor is on the same line as the the start of the block
  // or the block contains the cursor
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.unfoldCurrentBlock', async () => {
    await vscode.commands.executeCommand('editor.unfold', { levels: 1, direction: 'up' });
  }));
  // toggles fold and unfold depending on fold state
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.toggleFoldCurrentBlock', async () => {
    await vscode.commands.executeCommand('editor.toggleFold');
  }));

  /// Custom folding commands

  // fold all blocks that meet the inputed level, even if its in current cursor
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldLevelN', async (txt) => {
    // pick 1-7 to determine level to fold
    let option = await vscode.window.showQuickPick(foldLevelList, { matchOnDetail: true });
    if (!option) {
      return;
    }
    let level = Number(option.label);

    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let sorted_ranges = calc_levels(ranges);

    // there are no such ranges that meets level
    if (level > sorted_ranges.length) { return; }

    // compress ranges to just a index for the start of the range
    let target_ranges = sorted_ranges[level - 1];
    let target_lines = target_ranges.ranges.map(v => v.start);

    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // fold all blocks that level one less than the current cursor level
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldAllUpperBlocks', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let sorted_ranges = calc_levels(ranges);

    // get level of the block that the cursor is in
    let cursor_comp = find_cursor_range(sorted_ranges, txt.selection.start.line);

    if (!cursor_comp || cursor_comp.winner.level <= 1) {
      // we cannot find cursor level
      // or cursor_level is not high enough
      // (cant fold level 0)
      return;
    }

    // get cursor-folding.ignoreParentOnFoldAllUpperBlocks prop
    let exclParent = config.get<boolean>('ignoreParentOnFoldAllUpperBlocks');
    // get all ranges that have level: cursor_level - 1
    // if there is level 2, then there is level 1
    // so level - 1, get range for current level
    // (level is zero-based so -2) 
    let t_index = cursor_comp.winner.level - 2;
    let target_ranges = sorted_ranges[t_index];
    if (exclParent) {
      // remove current cursor range
      target_ranges.ranges.splice(cursor_comp.candidates[t_index].index, 1);
    }

    if (target_ranges) {
      // convert to number[]
      let target_lines = target_ranges.ranges.map(v => v.start);
      // do fold
      await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
    }
  }));
  // fold all blocks that level one more than the current cursor level
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldAllDeeperBlocks', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let sorted_ranges = calc_levels(ranges);

    // get level of the block that the cursor is in
    let cursor_range = find_cursor_range(sorted_ranges, txt.selection.start.line);
    if (!cursor_range || cursor_range.winner.level + 1 > sorted_ranges.length) {
      // we cannot find cursor level
      // or cursor_level is too high
      return;
    }
    // get all ranges that have level: cursor_level + 1
    // so level + 1 - 1 (zero-based)
    let target_ranges = sorted_ranges[cursor_range.winner.level];
    let target_lines = target_ranges.ranges.map(v => v.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // fold all blocks that level one more than the current cursor level, but only in its block
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldAllEnclosingDeeperBlocks', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let sorted_ranges = calc_levels(ranges);

    // get level of the block that the cursor is in
    let cursor_range = find_cursor_range(sorted_ranges, txt.selection.start.line);
    if (!cursor_range || cursor_range.winner.level + 1 > sorted_ranges.length) {
      // we cannot find cursor level
      // or cursor_level is too high
      return;
    }
    // get all lines that fill in between the winning range
    let target_lines = sorted_ranges[cursor_range.winner.level].ranges
      .filter(v => cursor_range.winner.range.start < v.start && cursor_range.winner.range.end > v.end)
      .map(v => v.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // fold all blocks that match level of cursor
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldSameIndent', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let sorted_ranges = calc_levels(ranges);

    // get level of the block that the cursor is in
    let cursor_range = find_cursor_range(sorted_ranges, txt.selection.start.line);
    if (!cursor_range) {
      // we cannot find cursor level
      return;
    }
    // get all lines that match level
    let target_lines = sorted_ranges[cursor_range.winner.level - 1].ranges.map(v => v.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // focus block
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldAllExceptCursor', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let sorted_ranges = calc_levels(ranges);

    // get level of the block that the cursor is in
    let cursor_range = find_cursor_range(sorted_ranges, txt.selection.start.line);
    if (!cursor_range) {
      // we cannot find cursor level
      return;
    }
    // idea is sorted_ranges - cursor_range = fold all except cursor
    // get prop
    let exclude_children = config.get<boolean>('ignoreChildFoldsOnFoldAllExceptCursor');
    // loop over matched levels
    for (let i = 0; i < sorted_ranges.length; i++) {
      if (cursor_range.candidates.length > i) {
        // remove matching ranges
        sorted_ranges[i].ranges.splice(cursor_range.candidates[i].index, 1);
      }
      else if (exclude_children) {
        // ranges level is higher than cursor
        // exclude whole range
        sorted_ranges[i].ranges = [];
      }
    }

    // get all lines that match level
    let target_ranges = sorted_ranges.reduce<vscode.FoldingRange[]>((prev, cur) => prev.concat(...cur.ranges), []);
    let target_lines = target_ranges.map(v => v.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // fold all blocks above cursor
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldUntilCursor', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);

    // get prop
    let exclude_within = config.get<boolean>('excludeCursorBlockOnFoldUntilCursor');

    // loop over them
    let scoped_ranges: vscode.FoldingRange[] = [];
    for (let range of ranges) {
      if (exclude_within && range.start <= txt.selection.start.line && range.end >= txt.selection.start.line) {
        // cursor is within a block that we need to exclude
        continue;
      }

      // if range starts after cursor
      if (range.start > txt.selection.start.line) {
        break;
      }
      else {
        scoped_ranges.push(range);
      }
    }

    // compile to lines
    let target_lines = scoped_ranges.map(s => s.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // fold all blocks below cursor
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldPastCursor', async (txt) => {
    // get all folding ranges (0-based)
    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);

    // get prop
    let exclude_within = config.get<boolean>('excludeCursorBlockOnFoldPastCursor');

    // loop over them
    let scoped_ranges: vscode.FoldingRange[] = [];
    for (let range of ranges) {

      if (exclude_within && range.start <= txt.selection.start.line && range.end >= txt.selection.start.line) {
        // cursor is within a block that we need to exclude
        continue;
      }
      else if (range.start < txt.selection.start.line) {
        // skip
        continue;
      }
      else {
        scoped_ranges.push(range);
      }
    }

    // compile to lines
    let target_lines = scoped_ranges.map(s => s.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }));
  // fold selections
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.foldSelection', async (txt) => {
    let require_full = config.get<boolean>('onlyFoldSelectionsWhenFullyCapped');

    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    // mutates array so copy it
    let relations = calc_relations([...ranges]);

    // match range with selection
    let matched_ranges: vscode.FoldingRange[] = [];
    if (require_full) {
      matched_ranges = find_common_folds_strict(relations, txt.selections);
    }
    else {
      matched_ranges = find_common_folds_loose(relations, txt.selections);
    }

    let lines = matched_ranges.map(v => v.start);
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: lines });
  }));
  // unfold selections
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('cursor-folding.unfoldSelection', async (txt) => {
    let require_full = config.get<boolean>('onlyFoldSelectionsWhenFullyCapped');

    let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
    let relations = calc_relations(ranges);

    // match range with selection
    let matched_ranges: vscode.FoldingRange[] = [];
    if (require_full) {
      matched_ranges = find_common_folds_strict(relations, txt.selections);
    }
    else {
      matched_ranges = find_common_folds_loose(relations, txt.selections);
    }

    let lines = matched_ranges.map(v => v.start);
    await vscode.commands.executeCommand('editor.unfold', { levels: 1, direction: 'up', selectionLines: lines });
  }));
}

/// Types
export type LevelRange = {
  ranges: vscode.FoldingRange[];
  level: number;
};
export type CursorRange = {
  range: vscode.FoldingRange;
  level: number;
  index: number;
}
export type CursorComp = {
  candidates: CursorRange[];
  winner: CursorRange;
}
export type RelationRange = {
  range: vscode.FoldingRange;
  children: RelationRange[];
}

/// Helper Functions
// finds the level which the cursor is enclosed in
export function find_cursor_range(ranges: LevelRange[], cursor_line: number)
  : CursorComp | null {

  let candidates: CursorRange[] = [];
  // surely no out of bounds here :)
  for (let lvl_range of ranges) {
    let top = 0;
    let bottom = lvl_range.ranges.length;
    let mid = Math.floor((top + bottom) / 2);

    while (top !== bottom) {
      if (cursor_line < lvl_range.ranges[mid].start) {
        // left of mid, set new bottom
        bottom = mid;
        mid = Math.floor((top + bottom) / 2);
      }
      else if (cursor_line > lvl_range.ranges[mid].end) {
        // right of mid, set new top
        top = mid + 1;
        mid = Math.floor((top + bottom) / 2);
      }
      else {
        // cursor is in this level
        candidates.push({ range: lvl_range.ranges[mid], level: lvl_range.level, index: mid });
        break;
      }
    }
  }

  // if there are multiple enclosing blocks, choose the highest level
  if (candidates.length > 0) {
    let winner = candidates.reduce((prev, cur) => prev.level >= cur.level ? prev : cur);
    return { winner, candidates };
  }
  return null;
}

// determine levels of folding ranges
export function calc_levels(ranges: vscode.FoldingRange[]) {
  let sorted_level_ranges: LevelRange[] = [];

  let level_stack: vscode.FoldingRange[] = [];
  let escape_indices: number[] = [];
  let cur_level = 1;

  for (let range of ranges) {
    if (escape_indices.length > 0 && range.start > escape_indices[escape_indices.length - 1]) {
      // we escape level
      escape_indices.pop();

      // we might hit a new level
      // or a previous level
      if (sorted_level_ranges.length >= cur_level) {
        // append stack to level range
        sorted_level_ranges[cur_level - 1].ranges.push(...level_stack);
      }
      else {
        // create new level range
        sorted_level_ranges.push({ ranges: level_stack, level: cur_level });
      }
      // empty array
      level_stack = [];
      cur_level--;
    }
    // if the last item on the stack 
    if (level_stack.length > 0 && level_stack[level_stack.length - 1].end > range.start) {
      // we hit a new level
      if (sorted_level_ranges.length >= cur_level) {
        // append stack to level range
        sorted_level_ranges[cur_level - 1].ranges.push(...level_stack);
      }
      else {
        // create new level range
        sorted_level_ranges.push({ ranges: level_stack, level: cur_level });
      }
      cur_level++; // new level reached
      escape_indices.push(level_stack[level_stack.length - 1].end);
      // empty array
      level_stack = [];
    }
    level_stack.push(range);
  }

  // add the last ranges
  if (sorted_level_ranges.length >= cur_level) {
    // append stack to level range
    sorted_level_ranges[cur_level - 1].ranges.push(...level_stack);
  }
  else {
    // create new level range
    sorted_level_ranges.push({ ranges: level_stack, level: cur_level });
  }

  return sorted_level_ranges;
}

/// functions used only in selection commands 

export function calc_relations(ranges: vscode.FoldingRange[], block_end = Number.MAX_VALUE): RelationRange[] {
  /*
    asdfasdf;
    asdfasdfa;

    asdfasdf;


    namspacec {
      asdf {
        new_asdf() {
        }
  
  
        otherfunc() {
        }
      }
  
  
      asdfa {
      }
    }
  
  */
  /* ranges
     415 -> 428
     416 -> 423
     417 -> 418
     421 -> 422
     426 -> 427
 
     1.
     sis = []
     range = 415 -> 428
     2.
     sis = [415 -> 428]
     range = 416 -> 423
     child = [_]
     3. N
     end = 428
     sis = []
     range = 416 -> 423
     4. 
     end = 428
     sis = [416 -> 423]
     range = 417 -> 418
     child = [_]
     5. N
     end = 423
     sis = []
     range = 417 -> 418
     6. 
     end = 423
     sis = [417 -> 418]
     range = 421 -> 422
     7. 
     end = 423
     sis = [417 -> 418, 421 -> 422]
     range = 426 -> 427
     8. E.4.
     end = 428
     sis = [416 -> 423(417 -> 418, 421 -> 422)]
     range = 426 -> 427
     9.
     end = 428
     sis = []
     10 E.2.
     sis = [415 -> 428(416 -> 423(417 -> 418, 421 -> 422), 426 -> 427)]
     child = []
 
     415 -> 428
       416 -> 423
         417 -> 418
         421 -> 422
       426 -> 427
  */
  let sibling_r: RelationRange[] = [];
  while (ranges.length > 0) {
    // if we go past end of block
    if (ranges.at(0)!.start > block_end) {
      // escape 
      return sibling_r;
    }
    // if the previous added range's end is larger than the new range's start
    else if (sibling_r.length > 0 && sibling_r.at(-1)!.range.end > ranges.at(0)!.start) {
      // we must be in a new block
      // is recursive because I'm lazy
      // TODO: Change this function to not be recursive
      let child_rel_ranges = calc_relations(ranges, sibling_r.at(-1)!.range.end); // <- if line is past this value we exit block

      // children belong to last sibling
      sibling_r.at(-1)!.children = child_rel_ranges;
    }
    else {
      // still in same block
      sibling_r.push({ range: ranges.shift()!, children: [] });
    }
  }
  // ranges has no ranges left
  return sibling_r;
}

/// only thing different in these functions is the condition
export function find_common_folds_loose(relations: RelationRange[], selections: readonly vscode.Selection[], level = 1): vscode.FoldingRange[] {
  let foldings: vscode.FoldingRange[] = [];
  // go through the top folds
  for (let relation of relations) {
    let isAdded = false;
    // see if added to foldings
    for (let selection of selections) {
      if (selection.start.line <= relation.range.start && selection.end.line >= relation.range.start ||
        selection.start.line <= relation.range.end && selection.end.line >= relation.range.end ||
        selection.start.line <= relation.range.start && selection.end.line >= relation.range.end) {
        foldings.push(relation.range);
        isAdded = true;
        break;
      }
    }
    // if not
    if (!isAdded) {
      // add children (possibly)
      foldings.push(...find_common_folds_loose(relation.children, selections, level + 1));
    }
  }
  // returns the most top-level folds necessary for all selections
  return foldings;
}
export function find_common_folds_strict(relations: RelationRange[], selections: readonly vscode.Selection[], level = 1): vscode.FoldingRange[] {
  let foldings: vscode.FoldingRange[] = [];
  // go through the top folds
  for (let relation of relations) {
    let isAdded = false;
    // see if added to foldings
    for (let selection of selections) {
      if (selection.start.line <= relation.range.start && selection.end.line >= relation.range.end) {
        foldings.push(relation.range);
        isAdded = true;
        break;
      }
    }
    // if not
    if (!isAdded) {
      // add children (possibly)
      foldings.push(...find_common_folds_strict(relation.children, selections, level + 1));
    }
  }
  // returns the most top-level folds necessary for all selections
  return foldings;
}

export function deactivate() { }
