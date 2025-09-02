import * as vscode from 'vscode';
import * as command from './commands';

export function activate(context: vscode.ExtensionContext) {
    /// regulars
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldAll', command.fold_all));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.unfoldAll', command.unfold_all));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldCurrentBlock', command.fold));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.unfoldCurrentBlock', command.unfold));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.toggleFoldCurrentBlock', command.toggle_fold));

    /// customs
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldLevelN', command.fold_level_n));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldAllUpperBlocks', command.fold_upper));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldAllDeeperBlocks', command.fold_deeper));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldAllEnclosingDeeperBlocks', command.fold_deeper_enclosing));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldSameIndent', command.fold_same_indent));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldAllExceptCursor', command.focus_cursor));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldUntilCursor', command.fold_until_cursor));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldPastCursor', command.fold_past_cursor));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.foldSelection', command.fold_selection));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(
        'cursor-folding.unfoldSelection', command.unfold_selection));
}

export function deactivate() { }
