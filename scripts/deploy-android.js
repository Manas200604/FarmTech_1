#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

function log(message) {
  console.log(`[DEPLOY] ${new Date().toISOString()} - ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
}

function executeCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (err) {
    error(`Command failed: ${command}`);
    error(err.message);
    process.exit(1);
  }
}

function checkADB() {
  try {
    executeCommand('adb version', { stdio: 'pipe' });
    log('ADB is available');
    return true;
  } catch (err) {
    error('ADB not found. Please install Android SDK Platform Tools.');
    return false;
  }
}

function getConnectedDevices() {
  try {
    const result = execSync('adb devices', { encoding: 'utf8' });
    const lines = result.split('\n').slice(1);
    const devices = lines
      .filter(line => line.trim() && line.includes('device'))
      .map(line => line.split('\t')[0]);
    
    return devices;
  } catch (err) {
    error('Failed to get connected devices');
    return [];
  }
}

function installAPK(apkPath, deviceId = null) {
  const deviceFlag = deviceId ? `-s ${deviceId}` : '';
  const command = `adb ${deviceFlag} install -r "${apkPath}"`;
  executeCommand(command);
}

function launchApp(packageName, deviceId = null) {
  const deviceFlag = deviceId ? `-s ${deviceId}` : '';
  const command = `adb ${deviceFlag} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
  executeCommand(command);
}

function main() {
  const args = process.argv.slice(2);
  const buildType = args[0] || 'debug';
  const deviceId = args[1];
  
  log(`🚀 Starting FarmTech Android deployment (${buildType})...`);
  
  // Check prerequisites
  if (!checkADB()) {
    process.exit(1);
  }
  
  // Check for APK
  const apkPath = `farmtech-${buildType}.apk`;
  if (!existsSync(apkPath)) {
    error(`APK not found: ${apkPath}`);
    log('Run the build script first: npm run android:build:release');
    process.exit(1);
  }
  
  // Get connected devices
  const devices = getConnectedDevices();
  if (devices.length === 0) {
    error('No Android devices connected');
    log('Please connect an Android device or start an emulator');
    process.exit(1);
  }
  
  log(`Found ${devices.length} connected device(s): ${devices.join(', ')}`);
  
  // Select device
  const targetDevice = deviceId || devices[0];
  if (deviceId && !devices.includes(deviceId)) {
    error(`Device ${deviceId} not found in connected devices`);
    process.exit(1);
  }
  
  log(`Deploying to device: ${targetDevice}`);
  
  // Install APK
  log('Installing APK...');
  installAPK(apkPath, targetDevice);
  
  // Launch app
  log('Launching app...');
  const packageName = buildType === 'debug' ? 'com.farmtech.app.debug' : 'com.farmtech.app';
  launchApp(packageName, targetDevice);
  
  log(`🎉 Deployment completed successfully!`);
  log(`📱 FarmTech is now running on ${targetDevice}`);
}

main();