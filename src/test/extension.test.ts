import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helper from '../helpers';

const ranges = [
  new vscode.FoldingRange(1, 10),
  new vscode.FoldingRange(2, 4),
  new vscode.FoldingRange(6, 9),
  new vscode.FoldingRange(11, 15),
];

suite('Cursor Folding Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');
  test('group_ranges groups ranges into levels', () => {
    const result = helper.group_ranges(ranges);
    const expected: vscode.FoldingRange[][] = [
      [new vscode.FoldingRange(1, 10), new vscode.FoldingRange(11, 15)],
      [new vscode.FoldingRange(2, 4), new vscode.FoldingRange(6, 9)],
    ];
    assert.deepStrictEqual(result, expected);
    assert.ok(result.length === expected.length);
  });

  test('find_cursor_range finds the innermost cursor range', () => {
    const level_ranges = helper.group_ranges(ranges);

    const cursor_lines = [1, 3, 4, 5, 7, 9, 11, 13, 15];
    const results = cursor_lines.map(v => helper.get_enclosing_ranges(level_ranges, v));
    const expect_winners = [
      { range: ranges[0], level: 1, index: 0 },
      { range: ranges[1], level: 2, index: 0 },
      { range: ranges[1], level: 2, index: 0 },
      { range: ranges[0], level: 1, index: 0 },
      { range: ranges[2], level: 2, index: 1 },
      { range: ranges[2], level: 2, index: 1 },
      { range: ranges[4], level: 1, index: 1 },
      { range: ranges[4], level: 1, index: 1 },
      { range: ranges[4], level: 1, index: 1 },
    ];

    results.every((r, i) => assert.equal(r.at(-1), expect_winners[i].index,
      `winner indices do not match`));
    results.every((r, i) => assert.ok(r.length === expect_winners[i].level, 
      `r.length != level`));
  });

  test('calc_relations builds nested structure', () => {
    const result: helper.RelationRange[] = helper.calc_relations([...ranges]);
    const expectation: helper.RelationRange[] = [
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
    const relations = helper.calc_relations([...ranges]);
    const selections = [
      [new vscode.Selection(3, 32, 3, 32), new vscode.Selection(1, 32, 5, 32)],
      [new vscode.Selection(1, 32, 15, 32)],
      [new vscode.Selection(11, 32, 13, 32)],
      [new vscode.Selection(3, 32, 7, 32)],
    ];


    const folds = selections.map(s => helper.find_common_folds_loose(relations, s));
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
    const relations = helper.calc_relations([...ranges]);
    const selections = [
      [new vscode.Selection(3, 32, 3, 32), new vscode.Selection(1, 32, 5, 32)],
      [new vscode.Selection(1, 32, 15, 32)],
      [new vscode.Selection(11, 32, 13, 32)],
      [new vscode.Selection(3, 32, 7, 32)],
    ];

    const folds = selections.map(s => helper.find_common_folds_strict(relations, s));
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
