import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// File extensions to count
const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md'];
const excludeDirs = ['node_modules', '.git', 'dist', 'build'];
const excludeFiles = ['.gitignore', 'package-lock.json'];

function countLinesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    return lines;
  } catch (error) {
    return 0;
  }
}

function shouldIncludeFile(filePath, fileName) {
  const ext = path.extname(fileName);
  return codeExtensions.includes(ext) && !excludeFiles.includes(fileName);
}

function shouldIncludeDir(dirName) {
  return !excludeDirs.includes(dirName) && !dirName.startsWith('.');
}

function scanDirectory(dirPath, results = { files: [], totalLines: 0 }) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && shouldIncludeDir(item)) {
      scanDirectory(fullPath, results);
    } else if (stat.isFile() && shouldIncludeFile(fullPath, item)) {
      const lines = countLinesInFile(fullPath);
      const relativePath = path.relative(__dirname, fullPath);
      
      results.files.push({
        path: relativePath,
        lines: lines,
        extension: path.extname(item)
      });
      results.totalLines += lines;
    }
  }
  
  return results;
}

// Count lines
console.log('🔍 Counting lines of code in FarmTech project...\n');

const results = scanDirectory(__dirname);

// Group by file type
const byExtension = {};
results.files.forEach(file => {
  const ext = file.extension;
  if (!byExtension[ext]) {
    byExtension[ext] = { count: 0, lines: 0, files: [] };
  }
  byExtension[ext].count++;
  byExtension[ext].lines += file.lines;
  byExtension[ext].files.push(file);
});

// Display results
console.log('📊 LINES OF CODE SUMMARY');
console.log('========================\n');

// By file type
console.log('📁 BY FILE TYPE:');
Object.entries(byExtension)
  .sort((a, b) => b[1].lines - a[1].lines)
  .forEach(([ext, data]) => {
    console.log(`${ext.padEnd(8)} ${data.lines.toString().padStart(6)} lines (${data.count} files)`);
  });

console.log('\n' + '='.repeat(40));
console.log(`🎯 TOTAL: ${results.totalLines.toLocaleString()} lines of code`);
console.log(`📄 FILES: ${results.files.length} files`);
console.log('='.repeat(40) + '\n');

// Top 10 largest files
console.log('📋 TOP 10 LARGEST FILES:');
results.files
  .sort((a, b) => b.lines - a.lines)
  .slice(0, 10)
  .forEach((file, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${file.path.padEnd(40)} ${file.lines.toString().padStart(4)} lines`);
  });

console.log('\n📂 DETAILED BREAKDOWN:');
console.log('======================\n');

// Group by directory
const byDirectory = {};
results.files.forEach(file => {
  const dir = path.dirname(file.path);
  if (!byDirectory[dir]) {
    byDirectory[dir] = { lines: 0, files: [] };
  }
  byDirectory[dir].lines += file.lines;
  byDirectory[dir].files.push(file);
});

Object.entries(byDirectory)
  .sort((a, b) => b[1].lines - a[1].lines)
  .forEach(([dir, data]) => {
    console.log(`📁 ${dir === '.' ? 'Root' : dir}`);
    console.log(`   ${data.lines} lines in ${data.files.length} files`);
    
    data.files
      .sort((a, b) => b.lines - a.lines)
      .forEach(file => {
        const fileName = path.basename(file.path);
        console.log(`   └── ${fileName.padEnd(30)} ${file.lines.toString().padStart(4)} lines`);
      });
    console.log('');
  });

console.log('✨ Analysis complete!');