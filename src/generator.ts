import * as fs from "fs";
import * as vscode from 'vscode';
import * as cp from "child_process";
import * as path from 'path';

export function generateTemplate(featureName: string, folderPath: string, isFullWidget: boolean) {
    fs.mkdir(`${folderPath}/${featureName}`, { recursive: true }, (err) => {
        if (err) {
            return false;
        }

        const controllerName = `controller`;
        const indexName = `index`;
        const screenName = `screen`;

        const controllerString: string = generateControllerString(featureName);
        const screenString: string = isFullWidget ? generateFulScreenString(featureName) : generateScreenString(featureName);

        fs.writeFile(`${folderPath}/${featureName}/${controllerName}.dart`, controllerString, (err) => { });
        fs.writeFile(`${folderPath}/${featureName}/${screenName}.dart`, screenString, (err) => { });
        cp.exec(`dart format ${folderPath}/${featureName}`, (err, stdout, stderr) => { });
    });
    return true;
}

function generateScreenString(featureName: string): string {
    var _featureName = capitalizeFirstLetter(featureName);
    return `import 'package:flutter/material.dart';\nimport 'package:provider/provider.dart';\n\nimport 'controller.dart';\n\nclass ${_featureName}Screen extends StatelessWidget {\n\tconst ${_featureName}Screen({super.key});\n\n\tstatic const routeName = "/${featureName}";\n\n\t@override\n\tWidget build(BuildContext context) {\n\t\treturn ChangeNotifierProvider(\n\t\t\tcreate: (BuildContext context) => ${_featureName}Controller()..init(),\n\t\t\tchild: _buildPage(),\n\t\t);\n\t}\n\n\tWidget _buildPage() {\n\t\treturn Scaffold(\n\t\t\tappBar: AppBar(\n\t\t\t\ttitle: const Text("${_featureName}"),\n\t\t\t),\n\t\t\tbody: Consumer<${_featureName}Controller>(\n\t\t\t\tbuilder: (context, controller, child) {\n\t\t\t\t\treturn Center(\n\t\t\t\t\t\tchild: Text("\${controller.ready}"),\n\t\t\t\t\t);\n\t\t\t\t},\n\t\t\t),\n\t\t);\n\t}\n}`;
}

function generateFulScreenString(featureName: string): string {
    var _featureName = capitalizeFirstLetter(featureName);
    return `import 'package:flutter/material.dart';\nimport 'package:provider/provider.dart';\n\nimport 'controller.dart';\n\nclass ${_featureName}Screen extends StatefulWidget {\n  const ${_featureName}Screen({super.key});\n\n  static const routeName = "/${featureName}";\n\n  @override\n  State<${_featureName}Screen> createState() => _${_featureName}ScreenState();\n}\n\nclass _${_featureName}ScreenState extends State<${_featureName}Screen> with AutomaticKeepAliveClientMixin {\n  @override\n  bool get wantKeepAlive => true;\n\n  @override\n  Widget build(BuildContext context) {\n    super.build(context);\n    return ChangeNotifierProvider(\n      create: (BuildContext context) => ${_featureName}Controller()..init(),\n      child: _buildPage(),\n    );\n  }\n\n  Widget _buildPage() {\n    return Scaffold(\n      appBar: AppBar(\n        title: const Text("${_featureName}"),\n      ),\n      body: Consumer<${_featureName}Controller>(\n        builder: (context, controller, child) {\n          return Center(\n            child: Text("\${controller.ready}"),\n          );\n        },\n      ),\n    );\n  }\n}`;
}

function generateControllerString(featureName: string): string {
    var _featureName = capitalizeFirstLetter(featureName);
    return `import 'package:flutter/material.dart';\n\nclass ${_featureName}Controller extends ChangeNotifier {\n  bool _isReady = false;\n  bool get ready => _isReady;\n\n  Future<void> init() async {\n    _isReady = true;\n    notifyListeners();\n  }\n}`;
}

function capitalizeFirstLetter(input: string): string {
    return input
        .toLowerCase()
        .replace(/(?:^|_)(\w)/g, (match, p1, index) =>
            index === 0 ? p1.toUpperCase() : p1.toLowerCase()
        );
}


export async function generateCommonDir(folderPath: string) {
    fs.writeFile(`${folderPath}/index.txt`, "flutter pub add dio provider get_it gap flutter_animate logger intl flutter_svg shared_preferences go_router\ndart pub add dev:json_serializable change_app_package_name", (_) => { });
    fs.mkdir(`${folderPath}/screens`, (_) => { });
    fs.mkdir(`${folderPath}/common`, { recursive: true }, (err) => {
        if (err) {
            return false;
        }
        fs.mkdir(`${folderPath}/common/models`, { recursive: true }, (_) => {
            fs.writeFile(`${folderPath}/common/models/example.dart`, "//generate Standard model: dart run build_runner build", (_) => { });
        });
        fs.mkdir(`${folderPath}/common/utils`, (_) => { });
        fs.mkdir(`${folderPath}/common/apis`, { recursive: true }, (_) => {
            fs.writeFile(`${folderPath}/common/apis/index.dart`, "library;\n // export './user.dart';", (_) => { });
        });
        fs.mkdir(`${folderPath}/common/components`, (_) => { });
        fs.mkdir(`${folderPath}/common/routers`, (_) => { });
    });
    return true;
}

export async function generateGoRouter() {
    const files = await vscode.workspace.findFiles(`lib/screens/**/screen.dart`, '**/build/**'); // 查找所有 screen.dart
    let routes: string[] = [];

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();

        // 匹配 class 类名
        const classMatch = text.match(/class\s+(\w+Screen)\s+extends\s+(\w+Widget)/);
        // 匹配 routeName 静态变量
        const routeMatch = text.match(/static\s+const\s+routeName\s*=\s*['"]([^'"]+)['"]/);

        if (classMatch && routeMatch) {
            const className = classMatch[1]; // 提取类名
            const routePath = routeMatch[1]; // 提取路径

            routes.push(`GoRoute(\n  path: '${routePath}',\n  builder: (context, state) => const ${className}(),\n)`);
        }
    }

    if (routes.length === 0) {
        vscode.window.showInformationMessage("未找到任何 screen.dart 文件");
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // 2. 生成 index.dart 内容
    const exportStatements = files.map(file => {
        const relativePath = vscode.workspace.asRelativePath(file);
        return `export '${relativePath.replace(/^lib\/screens\//, '')}';`;
    }).join('\n');

    // 写入 index.dart
    fs.writeFile(`${workspaceFolder}/lib/screens/index.dart`, exportStatements, (_) => { });

    // 3. 生成 go_router.dart 内容
    const goRouterContent = `import 'package:go_router/go_router.dart';\n\nimport 'package:${path.basename(workspaceFolder)}/screens/index.dart';\n\nfinal GoRouter router = GoRouter(\n  routes: [\n${files
        .map(file => {
            const featureName = file.path.split('/').slice(-2, -1)[0]; // 取 screen.dart 上一级目录名
            const className = capitalizeFirstLetter(featureName) + "Screen";
            return `    GoRoute(path: "/${featureName}", builder: (context, state) => const ${className}()),`;
        })
        .join('\n')}\n  ],\n);\n`;

    // 写入 go_router.dart
    fs.writeFile(`${workspaceFolder}/lib/common/routers/go_router.dart`,goRouterContent, (_) => { });

    return true;
}