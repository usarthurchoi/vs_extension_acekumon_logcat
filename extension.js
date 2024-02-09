const vscode = require('vscode');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const adb = require('adbkit');
const adbClient = adb.createClient();

let logLines = []; // In-memory storage for log lines
let adbProcess = null; // This will hold our logcat process
let logOutputChannel; // VS Code Output Channel for displaying logs
let logFilePath; // Path for the log file
let logStream = null;

let usePackagePicker = true;
let currentFilter = ''; // Simple string filter for demonstration purposes

function getLogFilePath() {
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		// Use the first workspace folder by default
		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		return path.join(workspaceFolder, "logcat.txt");
	} else {
		return null; // No workspace folder is open
	}
}

async function selectLogDirectory() {
	const options = {
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: 'Select Log Directory for LogCat Logs'
	};

	const folderUri = await vscode.window.showOpenDialog(options);

	if (folderUri && folderUri.length > 0) {
		return path.join(folderUri[0].fsPath, 'logcat.txt');
	} else {
		return null; // User cancelled the dialog
	}
}

function activate(context) {

	console.log('Your extension "logcat-extension" is now active!');

	// Initialize the Output Channel
	logOutputChannel = vscode.window.createOutputChannel("Android LogCat");

	// Define the log file path
	//logFilePath = path.join(vscode.workspace.rootPath || '', 'android_logcat_logs.txt');

	// Register command to start capturing logs
	let disposableStartLogCat = vscode.commands.registerCommand('acekumon.captureLogCat', async function () {
		logFilePath = getLogFilePath(); // Attempt to get a log file path based on an open workspace

		if (!logFilePath) {
			// No workspace folder is open; ask the user to select a directory
			logFilePath = await selectLogDirectory();
		}

		if (!logFilePath) {
			// User cancelled the directory selection or an error occurred
			vscode.window.showErrorMessage("LogCat Extension: Log directory selection was cancelled or an error occurred.");
			return;
		}

		// Read the setting
		const config = vscode.workspace.getConfiguration('acekumon');
		usePackagePicker = config.get('usePackagePicker');

		if (usePackagePicker) {
			// Logic to show package picker
			const newFilter = await pickPackages();
			if (!newFilter) {
				vscode.window.showErrorMessage("LogCat Extension: packages to track must be selected.");
				return;
			}
			currentFilter = newFilter.map(ele => ele.label);
		} else {
			const newFilter = await vscode.window.showInputBox({ prompt: 'Enter new log filter' });
			if (!newFilter) {
				vscode.window.showErrorMessage("LogCat Extension: packages to track must be selected.");
				return;
			}
			currentFilter = [newFilter];
		}
		logLines = [];
		// Prompt the user for a new filter
		// const newFilter = await vscode.window.showInputBox({ prompt: 'Enter new log filter' });
		// if (newFilter !== undefined) {
		// 	currentFilter = newFilter;
		// 	logLines = []; // Clear existing logs
		// 	// Consider restarting log capture or notifying the user to do so
		// }


		console.log(`using currentFilter ${currentFilter}...`)

		logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

		console.log(`logstream created....`)

		if (adbProcess === null) {
			console.log(`spawning adb logcat...`)

			adbProcess = spawn('adb', ['logcat']);
			adbProcess.stdout.on('data', (data) => {
				const lines = data.toString().split('\n');
				lines.forEach(line => {
					if (shouldIncludeLine(line)) { // Apply the filter
						logLines.push(line);
						logOutputChannel.appendLine(line); // Display line in the Output Channel
						//fs.appendFileSync(logFilePath, line + '\n'); // Append line to the log file
						logStream.write(line + '\n');
					}
				});
			});

			adbProcess.stderr.on('data', (data) => {
				console.error(`ADB Error: ${data}`);
			});

			adbProcess.on('close', (code) => {
				console.log(`adb logcat process exited with code ${code}`);
				adbProcess = null; // Reset the process variable when it's closed
				logStream.close();
				logStream = null;
			});

			// Show the output channel
			logOutputChannel.show(true);
		} else {
			vscode.window.showWarningMessage('LogCat capturing is already running.');
		}
	});

	let disposableStopLogCat = context.subscriptions.push(vscode.commands.registerCommand('acekumon.stopLogCat', function () {
		console.log(`From stopLogCat - about to kill adb ...`)
		// Implement logic to stop logcat process and close the file stream
		adbProcess.kill();
		adbProcess = null;
		console.log(`From stopLogCat -  DONE.`)
	}));

	context.subscriptions.push(disposableStartLogCat, disposableStopLogCat);
}

function deactivate() {
	// if (adbProcess !== null) {
	// 	adbProcess.kill(); // Ensure to kill the adb process on deactivation
	// 	adbProcess = null;
	// }
	console.log(`deactivate() -  DONE.`)
}

module.exports = {
	activate,
	deactivate
}

async function askForFilterWord() {
	// Implement the logic to prompt the user to input a filter word
	const filterWord = await vscode.window.showInputBox({ prompt: 'Enter a filter word' });
	console.log(`Filtering with word: ${filterWord}`);
}

async function pickPackages() {
	try {
		const devices = await adbClient.listDevices();
		const deviceQuickPicks = devices.map(device => ({
			label: device.id,
			description: "Android Device"
		}));

		const selectedDevice = await vscode.window.showQuickPick(deviceQuickPicks, {
			placeHolder: 'Select an Android device',
		});

		if (!selectedDevice) return null; // No device selected

		const packagesOutput = await adbClient.shell(selectedDevice.label, 'pm list packages');
		const packagesString = await adb.util.readAll(packagesOutput);
		const packagesList = packagesString.toString().split('\n').map(pkg => pkg.replace('package:', '').trim()).filter(pkg => pkg);

		const packageQuickPicks = packagesList.map(pkg => ({
			label: pkg,
			picked: false // Default not selected
		}));

		const selectedPackages = await vscode.window.showQuickPick(packageQuickPicks, {
			placeHolder: 'Select packages to work with',
			canPickMany: true, // Allow multiple selections
		});

		if (!selectedPackages || selectedPackages.length === 0) return null; // No package selected

		// Here, you can process the selected packages as needed
		vscode.window.showInformationMessage(`You selected ${selectedPackages.length} packages on ${selectedDevice.label}`);

		return selectedPackages;

	} catch (error) {
		console.error(error);
		vscode.window.showErrorMessage('Failed to list devices or packages.');
	}
}


function shouldIncludeLine(line) {
	// Check if the line includes any of the strings in currentFilter
	return currentFilter.some(filterString => line.includes(filterString));
}

