import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get all TypeScript and TypeScript React files with console.log statements
const findCommand = "find src -type f -name \"*.ts\" -o -name \"*.tsx\" | xargs grep -l \"console.log\"";
const filePaths = execSync(findCommand).toString().trim().split('\n');

console.log(`Found ${filePaths.length} files with console.log statements`);

let totalRemoved = 0;
let filesModified = 0;

// Process each file
filePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count console.log statements
  const matches = content.match(/console\.log\([^)]*\);?/g);
  const count = matches ? matches.length : 0;
  
  if (count === 0) {
    console.log(`No console.log statements found in ${filePath}`);
    return;
  }
  
  // Replace console.log statements with empty strings or comments
  // This regex matches console.log statements including multiline ones
  const newContent = content.replace(/console\.log\([^)]*\);?/g, '// Removed console.log');
  
  // Write the modified content back to the file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  totalRemoved += count;
  filesModified++;
  
  console.log(`Removed ${count} console.log statements from ${filePath}`);
});

console.log(`\nSummary:`);
console.log(`Total files modified: ${filesModified}`);
console.log(`Total console.log statements removed: ${totalRemoved}`); 