import * as fs from "fs";
import * as cp from "child_process";

export async function generateTemplate(featureName: string, folderPath: string) {
    await fs.mkdir(`${folderPath}/${featureName}`, { recursive: true }, async (err) => {
        if (err) {
            return false;
        }

        const controllerName = `controller`;
        const indexName = `index`;
        const screenName = `screen`;

        const controllerString: string = generateControllerString(featureName);
        const indexString: string = generateIndexString();
        const screenString: string = generateScreenString(featureName);

        await fs.writeFile(`${folderPath}/${featureName}/${controllerName}.dart`, controllerString, (err) => { });
        await fs.writeFile(`${folderPath}/${featureName}/${indexName}.dart`, indexString, (err) => { });
        await fs.writeFile(`${folderPath}/${featureName}/${screenName}.dart`, screenString, (err) => { });
        await cp.exec(`dart format ${folderPath}/${featureName}`, (err, stdout, stderr) => { });
    });
    return true;
}

function generateScreenString(featureName: string): string {
    var _featureName = capitalizeFirstLetter(featureName);
    return `import 'package:flutter/material.dart';\nimport 'package:provider/provider.dart';\n\nimport 'controller.dart';\n\nclass ${_featureName}Screen extends StatelessWidget {\n\tconst ${_featureName}Screen({super.key});\n\n\tstatic const routeName = "/${featureName}";\n\n\t@override\n\tWidget build(BuildContext context) {\n\t\treturn ChangeNotifierProvider(\n\t\t\tcreate: (BuildContext context) => ${_featureName}Controller()..init(),\n\t\t\tchild: _buildPage(),\n\t\t);\n\t}\n\n\tWidget _buildPage() {\n\t\treturn Scaffold(\n\t\t\tappBar: AppBar(\n\t\t\t\ttitle: const Text("${_featureName}"),\n\t\t\t),\n\t\t\tbody: Consumer<${_featureName}Controller>(\n\t\t\t\tbuilder: (context, controller, child) {\n\t\t\t\t\treturn Center(\n\t\t\t\t\t\tchild: Text("\${controller.count}"),\n\t\t\t\t\t);\n\t\t\t\t},\n\t\t\t),\n\t\t);\n\t}\n}`;
}

function generateIndexString(): string {
    return `export './screen.dart';`;
}

function generateControllerString(featureName: string): string {
    var _featureName = capitalizeFirstLetter(featureName);
    return `import 'package:flutter/material.dart';\n\nclass ${_featureName}Controller extends ChangeNotifier {\n  bool _isReady = false;\n  bool get ready => _isReady;\n\n  Future<void> init() async {\n    // The page needs to be displayed before it can be displayed\n    await Future.delayed(const Duration(seconds: 1)).then((_) => _isReady = true);\n    notifyListeners();\n  }\n}`;
}

function capitalizeFirstLetter(input: string): string {
    return input
        .toLowerCase()
        .replace(/(?:^|_)(\w)/g, (match, p1, index) =>
            index === 0 ? p1.toUpperCase() : p1.toLowerCase()
        );
}
