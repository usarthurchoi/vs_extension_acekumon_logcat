Acekumon Android LogCat Viewer Extension for VS Code

This extension aids in debugging Android applications by filtering and displaying Android LogCat output directly within Visual Studio Code. Users can specify a log file directory for offline inspection, and based on their preferences, filter the LogCat output by typing a filter word or selecting from a list of installed packages on the device.

Features

-Log File Directory Specification: Users must specify a directory for the logcat.txt file where filtered LogCat outputs are saved.

-Flexible Filtering: Depending on the extension settings, users can filter the LogCat output by typing a filter word or selecting from installed packages on an Android device.

-Real-time Log Viewing: The filtered LogCat output is displayed in real-time through a dedicated Output Channel within VS Code.


Getting Started

Prerequisites

-Ensure that you have the Android SDK installed and that adb (Android Debug Bridge) is correctly set up and accessible from your system's PATH.
- Visual Studio Code v1.XX.X or higher.

Setup

1. Install the Extension: Search for "Acekumon Android LogCat Viewer" in the VS Code Extensions Marketplace and install it.
2. Specify Log File Directory: Upon first run, the extension will prompt you to specify a directory for saving the logcat.txt file. This step is mandatory; the extension will exit if a directory is not specified.

Usage

1. Choose Filter Method: In the extension settings, configure your preferred method of filtering the LogCat output:
1.1 Type Filter Word: Directly input a keyword to filter the LogCat output.
1.2 Select Installed Packages: Choose from a list of packages installed on the connected Android device to filter the output.View Filtered LogCat Output: The filtered LogCat output will be displayed in the "Android LogCat" Output Channel within VS Code, and simultaneously saved to the logcat.txt file in the specified directory.

Extension Settings

This extension contributes the following settings:

- acekumon.captureLogCat: Enable picking packages from a list for filtering LogCat output. If set to false, users will input a filter word directly. Once filters obtained. It will apply filters to the LogCat log stream. And the filtered log output will be displayed in the VS code output channel, and a logcat.txt on theuser designated directory for off-line inspection.

- acekumon.stopLogCat: Stop Logcat logging.

Contributing

We welcome contributions and suggestions! Please open an issue or submit a pull request on our GitHub repository, https://github.com/usarthurchoi/vs_extension_acekumon_logcat.git

License

This extension is licensed under the MIT License - see the LICENSE file for details.


