#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const BUILD_TYPES = {
  debug: 'debug',
  release: 'release'
};

function log(message) {
  console.log(`[BUILD] ${new Date().toISOString()} - ${message}`);
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

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if Android project exists
  if (!existsSync('android')) {
    error('Android project not found. Run "npx cap add android" first.');
    process.exit(1);
  }
  
  // Check if dist directory exists
  if (!existsSync('dist')) {
    log('Dist directory not found. Building web app first...');
    executeCommand('npm run build');
  }
  
  log('Prerequisites check passed.');
}

function buildAndroid(buildType = 'debug') {
  log(`Starting Android ${buildType} build...`);
  
  // Sync Capacitor
  log('Syncing Capacitor...');
  executeCommand('npx cap sync android');
  
  // Build Android
  log(`Building Android ${buildType}...`);
  const gradleCommand = buildType === 'release' 
    ? './gradlew assembleRelease' 
    : './gradlew assembleDebug';
    
  executeCommand(gradleCommand, { cwd: 'android' });
  
  // Find the APK
  const apkPath = buildType === 'release'
    ? 'android/app/build/outputs/apk/release/app-release.apk'
    : 'android/app/build/outputs/apk/debug/app-debug.apk';
    
  if (existsSync(apkPath)) {
    log(`✅ Build successful! APK location: ${apkPath}`);
    
    // Copy to root for easy access
    const outputName = `farmtech-${buildType}.apk`;
    executeCommand(`cp "${apkPath}" "${outputName}"`);
    log(`📱 APK copied to: ${outputName}`);
  } else {
    error('APK not found after build');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const buildType = args[0] || 'debug';
  
  if (!Object.values(BUILD_TYPES).includes(buildType)) {
    error(`Invalid build type: ${buildType}. Use 'debug' or 'release'.`);
    process.exit(1);
  }
  
  log(`🚀 Starting FarmTech Android build (${buildType})...`);
  
  checkPrerequisites();
  buildAndroid(buildType);
  
  log(`🎉 Build completed successfully!`);
}

main();