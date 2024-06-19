import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as plist from 'plist';

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main(): Promise<void> {
    try {
        let printFile = getBooleanInput('print-file');
        let infoPlistPath = core.getInput('info-plist-path');

        if (!fs.existsSync(infoPlistPath)) {
            core.setFailed(`The file path for the Info.plist does not exist or is not found: ${infoPlistPath}`);
            process.exit(1);
        }

        core.debug(`Running task with ${infoPlistPath}`);

        let bundleShortVersionString: string = core.getInput('bundle-short-version-string');
        let bundleVersion: string = core.getInput('bundle-version');
        let appId: string = core.getInput('app-id');
        let bundleDisplayName: string = core.getInput('bundle-display-name');
        let fullVersionName: string = "";

        if (printFile) {
            core.info('Before update:');
            await exec.exec('cat', [infoPlistPath]);
        }

        let fileContent = fs.readFileSync(infoPlistPath, { encoding: 'utf8' });
        core.debug(JSON.stringify(fileContent));

        let obj = plist.parse(fileContent);
        if (bundleShortVersionString) {
            core.info(`Overriding CFBundleShortVersionString: ${bundleShortVersionString}`);
            obj['CFBundleShortVersionString'] = bundleShortVersionString;
        } else {
            bundleShortVersionString = obj['CFBundleShortVersionString'];
        }

        if (bundleVersion) {
            core.info(`Overriding CFBundleVersion: ${bundleVersion}`);
            obj['CFBundleVersion'] = bundleVersion;
        } else {
            bundleVersion = obj['CFBundleVersion'];
        }

        if (bundleDisplayName) {
            core.info(`Overriding CFBundleDisplayName: ${bundleDisplayName}`);
            obj['CFBundleDisplayName'] = bundleDisplayName;
        }

        if (appId) {
            core.info(`Overriding CFBundleIdentifier: ${appId}`);
            obj['CFBundleIdentifier'] = appId;
        }

        fs.chmodSync(infoPlistPath, "600");
        fs.writeFileSync(infoPlistPath, plist.build(obj));

        if (printFile) {
            core.info('After update:');
            await exec.exec('cat', [infoPlistPath]);
        }

        fullVersionName = `v${bundleShortVersionString}(${bundleVersion})`
        core.info(`Info.plist updated successfully`);
        core.exportVariable('FULL_VERSION_NAME', fullVersionName);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed(`Unhandled error: ${error}`);
        }
    }
}

function handleError(err: any): void {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
}

function getBooleanInput(inputName: string, defaultValue: boolean = false): boolean {
    return (core.getInput(inputName) || String(defaultValue)).toUpperCase() === 'TRUE';
}