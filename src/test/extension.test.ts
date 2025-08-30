import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	calc_levels, calc_relations, find_common_folds_loose,
	find_common_folds_strict, find_cursor_range,
	CursorComp, RelationRange,
	LevelRange,
	CursorRange
} from '../extension';

suite('Cursor Folding Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('calc_levels groups ranges into levels', () => {
		const ranges = [
			new vscode.FoldingRange(1, 10),
			new vscode.FoldingRange(2, 4),
			new vscode.FoldingRange(6, 9),
			new vscode.FoldingRange(11, 15),
		];

		const result = calc_levels(ranges);
		const expected: LevelRange[] = [
			{ level: 1, ranges: [new vscode.FoldingRange(1, 10), new vscode.FoldingRange(11, 15)] },
			{ level: 2, ranges: [new vscode.FoldingRange(2, 4), new vscode.FoldingRange(6, 9)] },
		];
		assert.deepStrictEqual(result, expected);
		assert.ok(result.length === expected.length);
	});

	test('find_cursor_range finds the innermost cursor range', () => {
		const fold_ranges = [
			new vscode.FoldingRange(1, 10),
			new vscode.FoldingRange(2, 4),
			new vscode.FoldingRange(6, 9),
			new vscode.FoldingRange(11, 15),
		];
		const level_ranges = calc_levels(fold_ranges);

		const cursor_lines = [1, 3, 4, 5, 7, 9, 11, 13, 15];
		const results = cursor_lines.map(v => find_cursor_range(level_ranges, v));
		const expect_winners: CursorRange[] = [
			{ range: fold_ranges[0], level: 1, index: 0 },
			{ range: fold_ranges[1], level: 2, index: 0 },
			{ range: fold_ranges[1], level: 2, index: 0 },
			{ range: fold_ranges[0], level: 1, index: 0 },
			{ range: fold_ranges[2], level: 2, index: 1 },
			{ range: fold_ranges[2], level: 2, index: 1 },
			{ range: fold_ranges[4], level: 1, index: 1 },
			{ range: fold_ranges[4], level: 1, index: 1 },
			{ range: fold_ranges[4], level: 1, index: 1 },
		];

		results.every((r, i) => assert.deepStrictEqual(r?.winner, expect_winners[i],
			`expected_winners[${i}] != results[${i}].winner`));
		assert.ok(results.length === expect_winners.length);
	});

	test('calc_relations builds nested structure', () => {
		const ranges = [
			new vscode.FoldingRange(1, 10),
			new vscode.FoldingRange(2, 4),
			new vscode.FoldingRange(6, 9),
			new vscode.FoldingRange(11, 15),
		];

		const result: RelationRange[] = calc_relations([...ranges]);
		const expectation: RelationRange[] = [
			{
				range: new vscode.FoldingRange(1, 10), children: [
					{ range: new vscode.FoldingRange(2, 4), children: [] },
					{ range: new vscode.FoldingRange(6, 9), children: [] },
				]
			},
			{ range: new vscode.FoldingRange(11, 15), children: [] },
		];

		assert.deepStrictEqual(result, expectation);
		assert.ok(result.length === expectation.length);
	});

	test('find_common_folds_loose matches any overlap', () => {
		const relations = calc_relations([
			new vscode.FoldingRange(1, 10),
			new vscode.FoldingRange(2, 4),
			new vscode.FoldingRange(6, 9),
			new vscode.FoldingRange(11, 15),
		]);
		const selections = [
			[new vscode.Selection(3, 32, 3, 32), new vscode.Selection(1, 32, 5, 32)],
			[new vscode.Selection(1, 32, 15, 32)],
			[new vscode.Selection(11, 32, 13, 32)],
			[new vscode.Selection(3, 32, 7, 32)],
		];


		const folds = selections.map(s => find_common_folds_loose(relations, s));
		const expectations = [
			[new vscode.FoldingRange(1, 10)],
			[new vscode.FoldingRange(1, 10), new vscode.FoldingRange(11, 15)],
			[new vscode.FoldingRange(11, 15)],
			[new vscode.FoldingRange(2, 4), new vscode.FoldingRange(6, 9)],
		];
		expectations.every((e, i) => assert.deepStrictEqual(folds[i], e));
		expectations.every((e, i) => assert.ok(folds[i].length === e.length));
	});

	test('find_common_folds_strict matches full enclosure only', () => {
		const relations = calc_relations([
			new vscode.FoldingRange(1, 10),
			new vscode.FoldingRange(2, 4),
			new vscode.FoldingRange(6, 9),
			new vscode.FoldingRange(11, 15),
		]);
		const selections = [
			[new vscode.Selection(3, 32, 3, 32), new vscode.Selection(1, 32, 5, 32)],
			[new vscode.Selection(1, 32, 15, 32)],
			[new vscode.Selection(11, 32, 13, 32)],
			[new vscode.Selection(3, 32, 7, 32)],
		];

		const folds = selections.map(s => find_common_folds_strict(relations, s));
		const expectations = [
			[new vscode.FoldingRange(2, 4)],
			[new vscode.FoldingRange(1, 10), new vscode.FoldingRange(11, 15)],
			[],
			[],
		];
		expectations.every((e, i) => assert.deepStrictEqual(folds[i], e));
		expectations.every((e, i) => assert.ok(folds[i].length === e.length));
	});
});
