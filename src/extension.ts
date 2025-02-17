import * as vscode from 'vscode';
import { generateTemplate } from './generator';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('flutter-provider-generator.buildProviderTemplate', async (uri: vscode.Uri) => {
        const featureName = await vscode.window.showInputBox({
            placeHolder: "Enter screen name",
            validateInput(value) {
                const featureNameRegex = /^[a-z]+(_[a-z]+)*$/;

                if (value && value.length > 0 && !featureNameRegex.test(value)) {
                    return 'Invalid feature name. Please use snake_case.';
                }
                return null;
            },
        });

        if (featureName && featureName.length > 0) {
            const success = await generateTemplate(featureName, uri.fsPath);
            if (!success) {
                vscode.window.showErrorMessage(`Failed to create ${featureName} feature!`);
                return;
            }
            vscode.window.showInformationMessage(`${featureName} feature created!`);
        }

    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
