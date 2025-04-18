"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectation = exports.fsMock = exports.childProcess = exports.mockVscode = exports.vscode = void 0;
exports.showDockerNotInstalledError = showDockerNotInstalledError;
exports.checkDockerPermissions = checkDockerPermissions;
exports.showDockerPermissionError = showDockerPermissionError;
exports.setupDevContainer = setupDevContainer;
exports.openFolderInContainer = openFolderInContainer;
exports.resetAllMocks = resetAllMocks;
exports.waitForPromise = waitForPromise;
exports.isDockerInstalled = isDockerInstalled;
exports.generateDockerCompose = generateDockerCompose;
exports.createMockVscodeModule = createMockVscodeModule;
exports.resetMocks = resetMocks;
exports.createMockContext = createMockContext;
exports.mockDockerSuccess = mockDockerSuccess;
exports.mockDockerFailure = mockDockerFailure;
exports.mockProjectFolderSelection = mockProjectFolderSelection;
exports.mockCacheFolderSelection = mockCacheFolderSelection;
exports.mockGitHubPatInput = mockGitHubPatInput;
exports.mockRemoteContainersExtension = mockRemoteContainersExtension;
exports.setupMockFileSystem = setupMockFileSystem;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = __importStar(require("os"));
const sinon = __importStar(require("sinon"));
const assert_1 = __importDefault(require("assert"));
// 環境変数でモックモードと統合テストモードを切り替え
const USE_MOCK = process.env.VSCODE_MOCK === '1';
console.log(`テストヘルパー: ${USE_MOCK ? 'モックモード' : '実際のVS Code APIを使用'}`);
let vscodeModule;
// モックモードの場合はモックを使用、そうでない場合は実際のVS Code APIを使用
if (USE_MOCK) {
    // モックモード - Sinonスタブを使用
    vscodeModule = {
        window: {
            showInformationMessage: sinon.stub(),
            showErrorMessage: sinon.stub(),
            showInputBox: sinon.stub(),
            showOpenDialog: sinon.stub(),
            activeTerminal: null,
            createOutputChannel: sinon.stub().returns({
                appendLine: sinon.stub(),
                append: sinon.stub(),
                show: sinon.stub(),
                dispose: sinon.stub()
            }),
            showWarningMessage: sinon.stub()
        },
        commands: {
            executeCommand: sinon.stub(),
            registerCommand: sinon.stub()
        },
        extensions: {
            getExtension: sinon.stub()
        },
        env: {
            openExternal: sinon.stub()
        },
        Uri: {
            file: sinon.stub(),
            parse: sinon.stub(),
            joinPath: sinon.stub()
        },
        ExtensionContext: {},
        workspace: {
            getConfiguration: sinon.stub().returns({
                get: sinon.stub(),
                update: sinon.stub()
            }),
            workspaceFolders: []
        }
    };
}
else {
    // 統合テストモード - 実際のVS Code APIを使用
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        vscodeModule = require('vscode');
        console.log('実際のVS Code APIを読み込みました');
    }
    catch (error) {
        console.error('VS Code APIの読み込みに失敗しました:', error);
        // エラー時はモックにフォールバック
        vscodeModule = {
            window: {
                showInformationMessage: () => Promise.resolve(undefined),
                showErrorMessage: () => Promise.resolve(undefined),
                showInputBox: () => Promise.resolve(undefined),
                showOpenDialog: () => Promise.resolve(undefined),
                activeTerminal: null
            },
            commands: {
                executeCommand: () => Promise.resolve(undefined),
                registerCommand: () => ({ dispose: () => { } })
            },
            extensions: {
                getExtension: () => undefined
            },
            env: {
                openExternal: () => Promise.resolve(false)
            },
            Uri: {
                file: (path) => ({ fsPath: path }),
                parse: (uri) => ({ toString: () => uri }),
                joinPath: (...args) => ({ fsPath: args.join('/') })
            },
            ExtensionContext: {}
        };
    }
}
// vscodeをエクスポート
exports.vscode = vscodeModule;
const execPromise = (0, util_1.promisify)(child_process_1.exec);
// VSCodeモジュールのモックを提供するヘルパーファイル
// VSCodeの基本的なAPIをモックしたオブジェクト
exports.mockVscode = {
    window: {
        showInformationMessage: sinon.stub(),
        showErrorMessage: sinon.stub(),
        showWarningMessage: sinon.stub(),
        createOutputChannel: sinon.stub().returns({
            appendLine: sinon.stub(),
            append: sinon.stub(),
            show: sinon.stub(),
            dispose: sinon.stub()
        }),
        showQuickPick: sinon.stub(),
        showInputBox: sinon.stub()
    },
    commands: {
        registerCommand: sinon.stub(),
        executeCommand: sinon.stub()
    },
    workspace: {
        getConfiguration: sinon.stub().returns({
            get: sinon.stub(),
            update: sinon.stub()
        }),
        workspaceFolders: []
    },
    extensions: {
        getExtension: sinon.stub()
    },
    ExtensionContext: function () {
        return {
            subscriptions: [],
            extensionPath: '/mock/extension/path',
            globalState: {
                get: sinon.stub(),
                update: sinon.stub()
            },
            workspaceState: {
                get: sinon.stub(),
                update: sinon.stub()
            }
        };
    }
};
// VSCodeモジュールの代わりにモックを設定
// typescriptではこの実装方法は少し違います
// jest.mock('vscode', () => mockVscode, { virtual: true });
// テストユーティリティ関数
function resetAllMocks() {
    // モックモードの場合のみモックをリセット
    if (USE_MOCK) {
        // すべてのモック関数をリセット
        sinon.reset();
        // 特定のメソッドを明示的にリセット
        if (exports.vscode.window.showErrorMessage?.resetHistory) {
            exports.vscode.window.showErrorMessage.resetHistory();
        }
        if (exports.vscode.window.showInformationMessage?.resetHistory) {
            exports.vscode.window.showInformationMessage.resetHistory();
        }
        if (exports.vscode.commands.executeCommand?.resetHistory) {
            exports.vscode.commands.executeCommand.resetHistory();
        }
        if (exports.vscode.extensions.getExtension?.resetHistory) {
            exports.vscode.extensions.getExtension.resetHistory();
        }
        // 必要に応じて他のメソッドもリセット
    }
    else {
        // 統合テストモードではリセット不要（実際のAPIを使用）
        console.log('統合テストモードではモックをリセットしません');
    }
}
// 非同期処理のテスト用ユーティリティ
function waitForPromise(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Dockerがインストールされているかを確認する関数
async function isDockerInstalled() {
    // テスト中は常にtrueを返す
    if (process.env.NODE_ENV === 'test') {
        return true;
    }
    // 実際の実装（テスト対象外）
    try {
        await execPromise('docker --version');
        return true;
    }
    catch (error) {
        return false;
    }
}
// Dockerがインストールされていない場合のエラーメッセージを表示
function showDockerNotInstalledError() {
    const message = 'Dockerがインストールされていません。この拡張機能を使用する前にDockerをインストールしてください。';
    const installButton = 'インストールガイド';
    vscodeModule.window.showErrorMessage(message, installButton).then((selection) => {
        if (selection === installButton) {
            vscodeModule.env.openExternal(vscodeModule.Uri.parse('https://docs.docker.com/get-docker/'));
        }
    });
}
// Dockerの権限を確認する関数
async function checkDockerPermissions() {
    try {
        await execPromise('docker info');
        return true;
    }
    catch (error) {
        // エラーメッセージに権限関連の文字列が含まれているか確認
        const errorMessage = error.toString().toLowerCase();
        if (errorMessage.includes('permission') || errorMessage.includes('denied') || errorMessage.includes('access')) {
            return false;
        }
        // 他のエラーの場合はDockerの問題ではない可能性があるため、インストールされていない扱いにする
        return false;
    }
}
// Dockerの権限エラーの場合のメッセージを表示
function showDockerPermissionError() {
    const message = 'Dockerの実行権限がありません。';
    const helpButton = '対処方法を確認';
    let helpMessage = '';
    if (os.platform() === 'linux') {
        helpMessage = 'ユーザーをdockerグループに追加してください: sudo usermod -aG docker $USER\nその後、ログアウトして再度ログインしてください。';
    }
    else if (os.platform() === 'darwin') {
        helpMessage = 'macOSでDockerの権限エラーが発生した場合は、Docker Desktopを再起動してみてください。';
    }
    else {
        helpMessage = 'Dockerの実行権限を確認してください。管理者権限で実行するか、適切なユーザー権限を設定してください。';
    }
    vscodeModule.window.showErrorMessage(message, helpButton).then((selection) => {
        if (selection === helpButton) {
            vscodeModule.window.showInformationMessage(helpMessage);
        }
    });
}
function setupDevContainer(context, targetPath) {
    const sourcePath = path.join(context.extensionUri.fsPath, ".devcontainer");
    copyFolderRecursiveSync(sourcePath, targetPath);
}
function openFolderInContainer(extensionStoragePath) {
    const folderUri = exports.vscode.Uri.file(extensionStoragePath);
    exports.vscode.commands.executeCommand("remote-containers.openFolder", folderUri).then(() => {
    }, (error) => {
        exports.vscode.window.showErrorMessage(`コンテナでフォルダを開くことができませんでした: ${error.message}`);
    });
}
// Docker Composeテンプレートを生成する関数 (テスト用シンプル実装)
function generateDockerCompose(projectPath, cachePath, githubToken) {
    // Windows形式のパスをUNIX形式に変換
    const normalizedProjectPath = projectPath.replace(/\\/g, '/');
    const normalizedCachePath = cachePath.replace(/\\/g, '/');
    return `version: '3'
services:
  workspace:
    image: kokeh/hu_bioinfo:stable
    volumes:
      - "${normalizedProjectPath}:/workspace"
      - "${normalizedCachePath}:/cache"
    environment:
      - GITHUB_TOKEN=${githubToken}
    command: sleep infinity`;
}
function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(source)) {
        return;
    }
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    const files = fs.readdirSync(source);
    for (const file of files) {
        const srcPath = path.join(source, file);
        const destPath = path.join(target, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderRecursiveSync(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
function createMockVscodeModule() {
    return exports.mockVscode;
}
// child_processモジュールのモック化
exports.childProcess = {
    exec: sinon.stub().callsFake((cmd, callback) => {
        if (callback && typeof callback === 'function') {
            callback(null, { stdout: 'success', stderr: '' }, '');
        }
        return {
            on: sinon.stub(),
            stdout: { on: sinon.stub() },
            stderr: { on: sinon.stub() }
        };
    })
};
// fsモジュールのモック化
exports.fsMock = {
    existsSync: sinon.stub().returns(true),
    mkdirSync: sinon.stub(),
    writeFileSync: sinon.stub(),
    readFileSync: sinon.stub().returns(''),
    readdirSync: sinon.stub().returns([]),
    copyFileSync: sinon.stub(),
    lstatSync: sinon.stub().returns({
        isDirectory: sinon.stub().returns(false)
    })
};
// VSCodeモックのリセット（主要なメソッドのみ）
function resetMocks() {
    if (USE_MOCK) {
        // モックモードの場合のみモックをリセット
        // VSCodeメソッドのモックリセット
        if (exports.vscode.window.showErrorMessage?.resetHistory) {
            exports.vscode.window.showErrorMessage.resetHistory();
        }
        if (exports.vscode.window.showInformationMessage?.resetHistory) {
            exports.vscode.window.showInformationMessage.resetHistory();
        }
        // デフォルト動作を再設定
        initializeDefaultStubs();
    }
    else {
        // 統合テストモードではリセット不要
        console.log('統合テストモードではモックをリセットしません');
    }
}
// デフォルトのスタブ値を初期化する補助関数
function initializeDefaultStubs() {
    // VSCode関連のスタブ初期化
    vscodeModule.window.showErrorMessage.returns(Promise.resolve(undefined));
    vscodeModule.window.showInformationMessage.returns(Promise.resolve(undefined));
    vscodeModule.window.showInputBox.returns(Promise.resolve(''));
    vscodeModule.window.showOpenDialog.returns(Promise.resolve(undefined));
    vscodeModule.commands.executeCommand.returns(Promise.resolve(undefined));
    // ファイルシステムのデフォルト値
    exports.fsMock.existsSync.returns(true);
    exports.fsMock.readFileSync.returns('');
    exports.fsMock.readdirSync.returns([]);
    exports.fsMock.lstatSync.returns({ isDirectory: sinon.stub().returns(false) });
    // 子プロセスの実行結果
    exports.childProcess.exec.callsFake((cmd, callback) => {
        if (callback && typeof callback === 'function') {
            callback(null, { stdout: 'success', stderr: '' }, '');
        }
        return {
            on: sinon.stub(),
            stdout: { on: sinon.stub() },
            stderr: { on: sinon.stub() }
        };
    });
}
// VSCodeのモックコンテキストを作成する関数
function createMockContext(extensionPath = '/extension/path') {
    return {
        extensionUri: { fsPath: extensionPath },
        globalStorageUri: { fsPath: '/storage/path' },
        subscriptions: [],
        globalState: {
            update: sinon.stub().resolves(),
            get: sinon.stub().returns(undefined)
        }
    };
}
// Dockerコマンドの成功をモックする
function mockDockerSuccess() {
    exports.childProcess.exec.callsFake((cmd, callback) => {
        if (cmd.includes('docker') && callback && typeof callback === 'function') {
            callback(null, { stdout: 'Docker is running', stderr: '' }, '');
        }
        return {
            on: sinon.stub(),
            stdout: { on: sinon.stub() },
            stderr: { on: sinon.stub() }
        };
    });
}
// Dockerコマンドの失敗をモックする
function mockDockerFailure(errorMsg = 'Docker command failed') {
    // テスト間でのスタブの継承を防ぐためにすべてのモックをリセット
    sinon.restore();
    // child_processのexecを新しく設定
    exports.childProcess.exec = sinon.stub();
    const error = new Error(errorMsg);
    // すべてのDockerコマンドに対して、エラーを返すように設定
    exports.childProcess.exec.callsFake((command, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        if (command.includes('docker')) {
            if (callback) {
                callback(error, null);
            }
            return { error: error };
        }
        // Dockerコマンド以外は正常に実行
        if (callback) {
            callback(null, { stdout: 'Success' });
        }
        return { error: null };
    });
    return exports.childProcess.exec;
}
// プロジェクトフォルダ選択のモック
function mockProjectFolderSelection(folderPath = '/test/project') {
    // モックモードの場合のみStubを操作
    if (USE_MOCK) {
        // 既存のモックをリセット
        exports.vscode.window.showOpenDialog.reset();
        exports.vscode.window.showOpenDialog.resolves([{ fsPath: folderPath }]);
        // コールバック関数を適切に設定
        exports.vscode.window.showOpenDialog.callsFake((options) => {
            return Promise.resolve([{ fsPath: folderPath }]);
        });
    }
    else {
        console.log('統合テストモードではmockProjectFolderSelectionは実際には何もしません');
    }
}
// キャッシュフォルダ選択のモック
function mockCacheFolderSelection(folderPath = '/test/cache') {
    // モックモードの場合のみStubを操作
    if (USE_MOCK) {
        // 既存のモックをリセット
        exports.vscode.window.showOpenDialog.reset();
        exports.vscode.window.showOpenDialog.resolves([{ fsPath: folderPath }]);
        // コールバック関数を適切に設定
        exports.vscode.window.showOpenDialog.callsFake((options) => {
            return Promise.resolve([{ fsPath: folderPath }]);
        });
    }
    else {
        console.log('統合テストモードではmockCacheFolderSelectionは実際には何もしません');
    }
}
// GitHub PATの入力モック
function mockGitHubPatInput(pat = 'fake-github-pat') {
    // モックモードの場合のみStubを操作
    if (USE_MOCK) {
        // 既存のモックをリセット
        exports.vscode.window.showInputBox.reset();
        exports.vscode.window.showInputBox.resolves(pat);
        // 明示的にスタブを設定
        exports.vscode.window.showInputBox.callsFake((options) => {
            return Promise.resolve(pat);
        });
    }
    else {
        console.log('統合テストモードではmockGitHubPatInputは実際には何もしません');
    }
}
// Remote Containers拡張機能の有無をモック
function mockRemoteContainersExtension(installed = true) {
    // モックモードの場合のみStubを操作
    if (USE_MOCK) {
        // 既存のモックをリセット
        exports.vscode.extensions.getExtension.reset();
        // 明示的にスタブを設定
        exports.vscode.extensions.getExtension.callsFake((extensionId) => {
            if (extensionId === 'ms-vscode-remote.remote-containers') {
                return installed ? { id: 'ms-vscode-remote.remote-containers' } : undefined;
            }
            return undefined;
        });
    }
    else {
        console.log('統合テストモードではmockRemoteContainersExtensionは実際には何もしません');
    }
}
// アサーション用のヘルパー
exports.expectation = {
    // エラーメッセージが表示されたことを確認
    errorMessageShown: (message) => {
        assert_1.default.ok(vscodeModule.window.showErrorMessage.calledWith(sinon.match(message)), `Error message "${message}" was not shown`);
    },
    // 情報メッセージが表示されたことを確認
    infoMessageShown: (message) => {
        assert_1.default.ok(vscodeModule.window.showInformationMessage.calledWith(sinon.match(message)), `Info message "${message}" was not shown`);
    },
    // コマンドが実行されたことを確認
    commandExecuted: (command, ...args) => {
        assert_1.default.ok(vscodeModule.commands.executeCommand.calledWith(command, ...args), `Command "${command}" was not executed`);
    },
    // Dockerコマンドが実行されたことを確認
    dockerCommandExecuted: (command) => {
        assert_1.default.ok(exports.childProcess.exec.calledWith(sinon.match(command)), `Docker command "${command}" was not executed`);
    },
    // ファイルが作成されたことを確認
    fileCreated: (filePath, content) => {
        assert_1.default.ok(exports.fsMock.writeFileSync.calledWith(sinon.match(filePath), content ? sinon.match(content) : sinon.match.any), `File "${filePath}" was not created`);
    }
};
// ダミーファイルシステムをセットアップする関数
function setupMockFileSystem(structure) {
    exports.fsMock.existsSync.callsFake((filePath) => {
        let current = structure;
        const parts = filePath.split(path.sep).filter(Boolean);
        for (const part of parts) {
            if (!current[part]) {
                return false;
            }
            current = current[part];
        }
        return true;
    });
    exports.fsMock.readdirSync.callsFake((dirPath) => {
        let current = structure;
        const parts = dirPath.split(path.sep).filter(Boolean);
        for (const part of parts) {
            if (!current[part]) {
                return [];
            }
            current = current[part];
        }
        return Object.keys(current);
    });
    exports.fsMock.lstatSync.callsFake((filePath) => {
        let current = structure;
        const parts = filePath.split(path.sep).filter(Boolean);
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                return { isDirectory: () => false };
            }
            current = current[parts[i]];
        }
        const lastPart = parts[parts.length - 1];
        const isDir = typeof current[lastPart] === 'object';
        return {
            isDirectory: () => isDir
        };
    });
}
//# sourceMappingURL=test-helper.js.map