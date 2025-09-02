import * as vscode from 'vscode';
import * as helper from './helpers';

export const config = vscode.workspace.getConfiguration('cursor-folding');

// folds everything
export async function fold_all() {
  await vscode.commands.executeCommand('editor.foldAll');
}
// unfolds everything
export async function unfold_all() {
  await vscode.commands.executeCommand('editor.unfoldAll');
}
// fold only the block which has the cursor
export async function fold() {
  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up' });
}
// unfold only the block which has the cursor
export async function unfold() {
  await vscode.commands.executeCommand('editor.unfold', { levels: 1, direction: 'up' });
}
// toggles fold and unfold depending on fold state
export async function toggle_fold() {
  await vscode.commands.executeCommand('editor.toggleFold');
}

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
/** fold all blocks that meet the inputed level, even if its in current cursor */
export async function fold_level_n(txt: vscode.TextEditor) {
  // pick from list to determine level to fold
  let option = await vscode.window.showQuickPick(foldLevelList, { matchOnDetail: true });
  if (!option) {
    return;
  }
  let level = Number(option.label);

  // get all folding ranges (0-based)
  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  let grouped = helper.group_ranges(ranges);

  // there are no such ranges that meets level
  if (grouped.length < level) { return; }

  // compress ranges to just a index for the start of the range
  let target_ranges = grouped[level - 1];
  let target_lines = target_ranges.map(v => v.start);

  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
}
/** fold all blocks that level one less than the current cursor level */
export async function fold_upper(txt: vscode.TextEditor) {
  // get all folding ranges (0-based)
  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  // group by level
  let grouped = helper.group_ranges(ranges);
  // get level of the block that the cursor is in
  let candidates = helper.get_enclosing_ranges(grouped, txt.selection.start.line);

  if (candidates.length <= 1) {
    // cursor level is not high enough
    return;
  }

  // get cursor-folding.ignoreParentOnFoldAllUpperBlocks prop
  let exclParent = config.get<boolean>('ignoreParentOnFoldAllUpperBlocks');

  // get upper level of cursor
  let upper_level = candidates.length - 1;
  // get ranges of upper level
  let upper_ranges = grouped[upper_level - 1];
  if (exclParent) {
    // remove current cursor range
    upper_ranges.splice(candidates[upper_level], 1);
  }

  if (upper_ranges) {
    // convert to number[]
    let target_lines = upper_ranges.map(v => v.start);
    // do fold
    await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
  }
}

/** fold all blocks that level one more than the current cursor level */
export async function fold_deeper(txt: vscode.TextEditor) {
  // get all folding ranges (0-based)
  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  let grouped = helper.group_ranges(ranges);
  // get level of the block that the cursor is in
  let candidates = helper.get_enclosing_ranges(grouped, txt.selection.start.line);
  if (candidates.length >= grouped.length) {
    // no deeper ranges
    return;
  }
  // get deeper ranges
  let target_ranges = grouped[candidates.length];
  let target_lines = target_ranges.map(v => v.start);
  // do fold
  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
}
// fold all blocks that level one more than the current cursor level, but only in its block
export async function fold_deeper_enclosing(txt: vscode.TextEditor) {
  // get all folding ranges (0-based)
  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  let grouped = helper.group_ranges(ranges);
  // get level of the block that the cursor is in
  let candidates = helper.get_enclosing_ranges(grouped, txt.selection.start.line);
  if (candidates.length >= grouped.length) {
    // no deeper ranges
    return;
  }
  // get all lines that fill in between the winning range
  let target_lines = grouped[candidates.length]
    .filter(v => grouped[candidates.length - 1][candidates.at(-1)!].start < v.start &&
      grouped[candidates.length - 1][candidates.at(-1)!].end > v.end)
    .map(v => v.start);
  // do fold
  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
}

// fold all blocks that match level of cursor
export async function fold_same_indent(txt: vscode.TextEditor) {
  // get all folding ranges (0-based)
  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  let grouped = helper.group_ranges(ranges);
  let candidates = helper.get_enclosing_ranges(grouped, txt.selection.start.line);

  if (candidates.length <= 0) {
    return; // nothing to fold
  }
  // get all lines that match level
  let target_lines = grouped[candidates.length - 1].map(v => v.start);
  // do fold
  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
}
// focus block
export async function focus_cursor(txt: vscode.TextEditor) {
  // get all folding ranges (0-based)
  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  let grouped = helper.group_ranges(ranges);

  // get level of the block that the cursor is in
  let enclosed = helper.get_enclosing_ranges(grouped, txt.selection.start.line);
  if (enclosed.length <= 0) {
    return; // nothing
  }
  // idea is sorted_ranges - cursor_range = fold all except cursor
  // get prop
  let exclude_children = config.get<boolean>('ignoreChildFoldsOnFoldAllExceptCursor');
  // loop over matched levels
  for (let i = 0; i < grouped.length; i++) {
    if (enclosed.length > i) {
      // remove matching ranges
      grouped[i].splice(enclosed[i], 1);
    }
    else if (exclude_children) {
      // ranges level is higher than cursor
      // exclude whole range
      grouped[i] = [];
    }
  }

  // get all lines that match level
  let target_ranges = grouped.reduce<vscode.FoldingRange[]>((prev, cur) => prev.concat(...cur), []);
  let target_lines = target_ranges.map(v => v.start);
  // do fold
  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: target_lines });
 
  // new do unfold of children
  let unfold_children = config.get<boolean>('cursor-folding.unfoldChildFoldsOnFoldAllExceptCursor');
  if (!unfold_children || grouped.length <= enclosed.length) {
    return; // nothing to unfold
  }
  let unfolds: number[] = [];
  let parent = grouped[enclosed.length - 1][enclosed.at(-1)!];
  for (let child_range of grouped[enclosed.length]) {
    if (child_range.start > parent.start && child_range.end < parent.end) {
      unfolds.push(child_range.start);
    }
  }
  await vscode.commands.executeCommand('editor.unfold', { levels: 1, direction: 'up', selectionLines: unfolds });
}

// fold all blocks above cursor
export async function fold_until_cursor(txt: vscode.TextEditor) {
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
}
// fold all blocks below cursor
export async function fold_past_cursor(txt: vscode.TextEditor) {
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
};
// fold selections
export async function fold_selection(txt: vscode.TextEditor) {
  let require_full = config.get<boolean>('onlyFoldSelectionsWhenFullyCapped');

  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  // mutates array so copy it
  let relations = helper.calc_relations([...ranges]);

  // match range with selection
  let matched_ranges: vscode.FoldingRange[] = [];
  if (require_full) {
    matched_ranges = helper.find_common_folds_strict(relations, txt.selections);
  }
  else {
    matched_ranges = helper.find_common_folds_loose(relations, txt.selections);
  }

  let lines = matched_ranges.map(v => v.start);
  await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'up', selectionLines: lines });
}
// unfold selections
export async function unfold_selection(txt: vscode.TextEditor) {
  let require_full = config.get<boolean>('onlyFoldSelectionsWhenFullyCapped');

  let ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', txt.document.uri);
  let relations = helper.calc_relations(ranges);

  // match range with selection
  let matched_ranges: vscode.FoldingRange[] = [];
  if (require_full) {
    matched_ranges = helper.find_common_folds_strict(relations, txt.selections);
  }
  else {
    matched_ranges = helper.find_common_folds_loose(relations, txt.selections);
  }

  let lines = matched_ranges.map(v => v.start);
  await vscode.commands.executeCommand('editor.unfold', { levels: 1, direction: 'up', selectionLines: lines });
}
