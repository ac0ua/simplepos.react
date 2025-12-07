/**
 * Build Output Script
 * Creates a deployment-ready folder and tracks changed files
 * 
 * Usage: npm run build:output
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'deploy-output');
const MANIFEST_FILE = path.join(ROOT_DIR, '.deploy-manifest.json');
const CHANGES_FILE = path.join(OUTPUT_DIR, 'UPLOAD-THESE-FILES.txt');

// Files and folders to include in deployment
const DEPLOY_ITEMS = [
  // Frontend build output (will be copied from frontend/dist)
  { src: 'frontend/dist', dest: '', type: 'frontend' },
  
  // PHP Backend
  { src: 'php-backend', dest: 'php-backend', type: 'backend' },
  
  // Root htaccess
  { src: '.htaccess', dest: '.htaccess', type: 'config' },
  
  // Uploads folder (gallery images)
  { src: 'backend/uploads', dest: 'backend/uploads', type: 'uploads' },
];

// Files/folders to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.env',
  '.env.local',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '*.bak',
  '*.tmp',
  'server-migration.php', // Security - don't auto-deploy migration scripts
];

function shouldExclude(filePath) {
  const fileName = path.basename(filePath);
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return fileName.endsWith(pattern.slice(1));
    }
    return fileName === pattern || filePath.includes(pattern);
  });
}

function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

function getAllFiles(dirPath, basePath = '') {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);
    
    if (shouldExclude(fullPath)) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      files.push({
        path: relativePath.replace(/\\/g, '/'),
        fullPath: fullPath,
        size: stat.size,
        mtime: stat.mtime.toISOString()
      });
    }
  }
  
  return files;
}

function copyFileSync(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠ Source not found: ${src}`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (shouldExclude(srcPath)) {
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function loadManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('  ⚠ Could not load previous manifest, treating all files as new');
  }
  return { files: {}, lastBuild: null };
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  console.log('\n========================================');
  console.log('  SimplePOS Build Output Tool');
  console.log('========================================\n');
  
  // Step 1: Run the regular build
  const viteBase = process.env.VITE_BASE || '/simplepos.react/';
  console.log(`Step 1: Building frontend for base path: ${viteBase}\n`);
  try {
    execSync('npm run build', { 
      cwd: path.join(ROOT_DIR, 'frontend'),
      stdio: 'inherit',
      env: { ...process.env, VITE_BASE: viteBase }
    });
  } catch (e) {
    console.error('Build failed!');
    process.exit(1);
  }
  
  // Step 2: Clean and create output directory
  console.log('\nStep 2: Preparing output directory...');
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`  ✓ Created: ${OUTPUT_DIR}`);
  
  // Step 3: Copy files to output directory
  console.log('\nStep 3: Copying files...');
  
  for (const item of DEPLOY_ITEMS) {
    const srcPath = path.join(ROOT_DIR, item.src);
    const destPath = item.dest ? path.join(OUTPUT_DIR, item.dest) : OUTPUT_DIR;
    
    if (!fs.existsSync(srcPath)) {
      console.log(`  ⚠ Skipping (not found): ${item.src}`);
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      if (item.type === 'frontend') {
        // Copy frontend/dist contents directly to output root
        copyDirSync(srcPath, destPath);
        console.log(`  ✓ Copied frontend build files`);
      } else {
        copyDirSync(srcPath, destPath);
        console.log(`  ✓ Copied: ${item.src} → ${item.dest}`);
      }
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`  ✓ Copied: ${item.src}`);
    }
  }
  
  // Step 4: Calculate hashes and detect changes
  console.log('\nStep 4: Detecting changes...');
  
  const previousManifest = loadManifest();
  const currentFiles = getAllFiles(OUTPUT_DIR);
  const newManifest = { files: {}, lastBuild: new Date().toISOString() };
  
  const changes = {
    added: [],
    modified: [],
    deleted: []
  };
  
  // Check for added and modified files
  for (const file of currentFiles) {
    const hash = getFileHash(file.fullPath);
    newManifest.files[file.path] = { hash, size: file.size };
    
    if (!previousManifest.files[file.path]) {
      changes.added.push({ path: file.path, size: file.size });
    } else if (previousManifest.files[file.path].hash !== hash) {
      changes.modified.push({ path: file.path, size: file.size });
    }
  }
  
  // Check for deleted files
  for (const filePath of Object.keys(previousManifest.files)) {
    if (!newManifest.files[filePath]) {
      changes.deleted.push({ path: filePath });
    }
  }
  
  // Save new manifest
  saveManifest(newManifest);
  
  // Step 5: Generate changes report
  console.log('\nStep 5: Generating upload report...');
  
  const totalChanges = changes.added.length + changes.modified.length;
  const report = [];
  
  report.push('========================================');
  report.push('  SIMPLEPOS DEPLOYMENT - FILES TO UPLOAD');
  report.push('========================================');
  report.push('');
  report.push(`Generated: ${new Date().toLocaleString()}`);
  report.push(`Previous build: ${previousManifest.lastBuild || 'Never'}`);
  report.push('');
  report.push('----------------------------------------');
  report.push(`SUMMARY: ${totalChanges} files to upload`);
  report.push('----------------------------------------');
  report.push(`  New files:      ${changes.added.length}`);
  report.push(`  Modified files: ${changes.modified.length}`);
  report.push(`  Deleted files:  ${changes.deleted.length}`);
  report.push('');
  
  if (changes.added.length > 0) {
    report.push('========================================');
    report.push('NEW FILES (upload these):');
    report.push('========================================');
    for (const file of changes.added) {
      report.push(`  + ${file.path}  (${formatSize(file.size)})`);
    }
    report.push('');
  }
  
  if (changes.modified.length > 0) {
    report.push('========================================');
    report.push('MODIFIED FILES (upload these):');
    report.push('========================================');
    for (const file of changes.modified) {
      report.push(`  * ${file.path}  (${formatSize(file.size)})`);
    }
    report.push('');
  }
  
  if (changes.deleted.length > 0) {
    report.push('========================================');
    report.push('DELETED FILES (remove from server):');
    report.push('========================================');
    for (const file of changes.deleted) {
      report.push(`  - ${file.path}`);
    }
    report.push('');
  }
  
  if (totalChanges === 0 && changes.deleted.length === 0) {
    report.push('========================================');
    report.push('NO CHANGES DETECTED');
    report.push('========================================');
    report.push('All files are up to date with the last build.');
    report.push('');
  }
  
  report.push('========================================');
  report.push('DEPLOYMENT FOLDER:');
  report.push('========================================');
  report.push(`  ${OUTPUT_DIR}`);
  report.push('');
  report.push('Upload the contents of this folder to your server\'s');
  report.push('/simplepos.react/ directory.');
  report.push('');
  report.push('========================================');
  report.push('REMEMBER:');
  report.push('========================================');
  report.push('1. Update php-backend/config/database.php with server credentials');
  report.push('2. Run the database migration if this is first deployment');
  report.push('3. Set proper file permissions (755 for folders, 644 for files)');
  report.push('');
  
  const reportContent = report.join('\n');
  fs.writeFileSync(CHANGES_FILE, reportContent);
  
  // Print summary to console
  console.log('\n' + '='.repeat(50));
  console.log('  BUILD OUTPUT COMPLETE!');
  console.log('='.repeat(50));
  console.log(`\n  Output folder: ${OUTPUT_DIR}`);
  console.log(`  Total files: ${currentFiles.length}`);
  console.log(`\n  Changes since last build:`);
  console.log(`    + ${changes.added.length} new files`);
  console.log(`    * ${changes.modified.length} modified files`);
  console.log(`    - ${changes.deleted.length} deleted files`);
  console.log(`\n  See: ${CHANGES_FILE}`);
  console.log('\n' + '='.repeat(50) + '\n');
}

main().catch(console.error);
