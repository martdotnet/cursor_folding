import * as vscode from 'vscode';

/// Types
export type RelationRange = {
  range: vscode.FoldingRange;
  children: RelationRange[];
}

/// Helper Functions

/**
 * @param ranges - an array of `vscode.FoldingRange` used to describe the start and each of each collapsable fold
 *                 in a document. Typically the result of command `vscode.executeFoldingRangeProvider`.
 * @returns grouped levels such that if `let grouped = group_ranges(ranges)`, then `grouped[level - 1]` returns
 *          the ranges that are that level. For example, `grouped[0]` are level 1 ranges.
 */
export function group_ranges(ranges: vscode.FoldingRange[]): vscode.FoldingRange[][] {
  // the current level
  let level = 1;
  // this is the total levels
  let levels: vscode.FoldingRange[][] = [];
  // this is the list of parents
  let parent_ranges: vscode.FoldingRange[] = [];

  for (let cur_range of ranges) {
    // while current range is out of parent range
    while (parent_ranges.length > 0 && cur_range.start > parent_ranges.at(-1)!.end) {
      // pop parent range
      parent_ranges.pop();
      // return to prev level
      level--;
    }
    // not sure if while is correct
    // while current range is within prev range
    while (levels.length >= level && levels[level - 1].length > 0 && levels[level - 1].at(-1)!.end > cur_range.start) {
      // push parent range
      parent_ranges.push(levels[level - 1].at(-1)!);
      // new level
      level++;
    }

    if (levels.length >= level) {
      // add to level
      levels[level - 1].push(cur_range);
    }
    else {
      // create level
      levels.push([cur_range]);
    }
  }
  return levels;
}

/**
 * @param grouped_ranges - The result of {@link group_ranges() `group_ranges()`}
 * @param target_line - The line you want enclosing ranges of. Typically, `txt.selection.start.line`
 * @returns The indices of ranges `group_ranges()` that the `target_line` is contained in. 
 *          If `let grouped = group_ranges(ranges)` and `let enclosed =
 *          get_enclosing_ranges(grouped, txt.selection.start.line)`,
 *          `enclosed.length` is the level of the cursor. Also, `grouped[enclosed.length - 1][enclosed.at(-1)!]` 
 *          is the furthest range that contains the cursor.
 */
export function get_enclosing_ranges(grouped_ranges: vscode.FoldingRange[][], target_line: number)
  : number[] {

  let candidate_indices: number[] = [];
  // binary search
  for (let i = 0; i < grouped_ranges.length; i++) {
    let top = 0;
    let bottom = grouped_ranges[i].length;
    let mid = Math.floor((top + bottom) / 2);

    while (top !== bottom) {
      if (target_line < grouped_ranges[i][mid].start) {
        bottom = mid;
        mid = Math.floor((top + bottom) / 2);
      }
      else if (target_line > grouped_ranges[i][mid].end) {
        top = mid + 1;
        mid = Math.floor((top + bottom) / 2);
      }
      else {
        // cursor is in this level
        candidate_indices.push(mid);
        break;
      }
    }
  }
  return candidate_indices;
}

export function calc_relations(ranges: vscode.FoldingRange[], block_end = Number.MAX_VALUE): RelationRange[] {
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