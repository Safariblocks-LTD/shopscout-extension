#!/usr/bin/env node
/**
 * ShopScout AI Integration Validation Script
 * Checks all files, syntax, and integration points
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

function checkFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

function validateJavaScript(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common syntax issues
    const issues = [];
    
    // Check for unmatched braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for unmatched parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for async/await usage
    const hasAsync = content.includes('async ');
    const hasAwait = content.includes('await ');
    if (hasAwait && !hasAsync) {
      issues.push('Warning: await used without async function');
    }
    
    return { valid: issues.length === 0, issues };
  } catch (err) {
    return { valid: false, issues: [err.message] };
  }
}

function validateManifest() {
  try {
    const manifestPath = path.join(__dirname, 'manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);
    
    const issues = [];
    
    // Check content_scripts
    if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
      issues.push('No content_scripts defined');
    } else {
      const contentScript = manifest.content_scripts[0];
      
      // Check if AI files are included
      const requiredFiles = [
        'ai-utils.js',
        'ai-summary-renderer.js',
        'ai-summary-integration.js',
        'content.js'
      ];
      
      const requiredCSS = ['ai-summary.css'];
      
      requiredFiles.forEach(file => {
        if (!contentScript.js || !contentScript.js.includes(file)) {
          issues.push(`Missing ${file} in content_scripts.js`);
        }
      });
      
      requiredCSS.forEach(file => {
        if (!contentScript.css || !contentScript.css.includes(file)) {
          issues.push(`Missing ${file} in content_scripts.css`);
        }
      });
    }
    
    // Check icons
    const requiredIcons = ['16', '32', '48', '128'];
    requiredIcons.forEach(size => {
      if (!manifest.icons || !manifest.icons[size]) {
        issues.push(`Missing icon size: ${size}`);
      } else {
        const iconPath = path.join(__dirname, manifest.icons[size]);
        if (!checkFileExists(iconPath)) {
          issues.push(`Icon file not found: ${manifest.icons[size]}`);
        }
      }
    });
    
    return { valid: issues.length === 0, issues };
  } catch (err) {
    return { valid: false, issues: [err.message] };
  }
}

function checkIntegrationPoints() {
  const contentPath = path.join(__dirname, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const issues = [];
  
  // Check for AI integration calls
  if (!content.includes('initializeAISummary')) {
    issues.push('Missing initializeAISummary call in content.js');
  }
  
  if (!content.includes('cleanupAISummary')) {
    issues.push('Missing cleanupAISummary call in content.js');
  }
  
  // Check for proper function checks
  if (!content.includes('typeof initializeAISummary === \'function\'')) {
    issues.push('Missing function existence check for initializeAISummary');
  }
  
  return { valid: issues.length === 0, issues };
}

// Main validation
console.log('\n' + '='.repeat(60));
log('ShopScout AI Integration Validation', 'blue');
console.log('='.repeat(60) + '\n');

let totalIssues = 0;

// 1. Check core AI files
log('1. Checking AI Core Files...', 'blue');
const aiFiles = [
  'ai-utils.js',
  'ai-summary-renderer.js',
  'ai-summary-integration.js',
  'ai-summary.css'
];

aiFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = checkFileExists(filePath);
  const size = checkFileSize(filePath);
  
  if (exists) {
    log(`  ✓ ${file} (${(size / 1024).toFixed(1)} KB)`, 'green');
    
    if (file.endsWith('.js')) {
      const validation = validateJavaScript(filePath);
      if (!validation.valid) {
        validation.issues.forEach(issue => {
          log(`    ✗ ${issue}`, 'red');
          totalIssues++;
        });
      }
    }
  } else {
    log(`  ✗ ${file} NOT FOUND`, 'red');
    totalIssues++;
  }
});

// 2. Check manifest.json
log('\n2. Validating manifest.json...', 'blue');
const manifestValidation = validateManifest();
if (manifestValidation.valid) {
  log('  ✓ Manifest is valid', 'green');
} else {
  manifestValidation.issues.forEach(issue => {
    log(`  ✗ ${issue}`, 'red');
    totalIssues++;
  });
}

// 3. Check integration points
log('\n3. Checking Integration Points...', 'blue');
const integrationValidation = checkIntegrationPoints();
if (integrationValidation.valid) {
  log('  ✓ All integration points present', 'green');
} else {
  integrationValidation.issues.forEach(issue => {
    log(`  ✗ ${issue}`, 'red');
    totalIssues++;
  });
}

// 4. Check icon files
log('\n4. Checking Icon Files...', 'blue');
const iconSizes = ['16', '32', '48', '128'];
iconSizes.forEach(size => {
  const iconPath = path.join(__dirname, `assets/icons/shopscoutlogo${size}.png`);
  const exists = checkFileExists(iconPath);
  const fileSize = checkFileSize(iconPath);
  
  if (exists && fileSize > 0) {
    log(`  ✓ shopscoutlogo${size}.png (${(fileSize / 1024).toFixed(1)} KB)`, 'green');
  } else {
    log(`  ✗ shopscoutlogo${size}.png NOT FOUND or EMPTY`, 'red');
    totalIssues++;
  }
});

// 5. Check documentation
log('\n5. Checking Documentation...', 'blue');
const docs = [
  'AI_INTEGRATION.md',
  'AI_TESTING_GUIDE.md'
];

docs.forEach(doc => {
  const docPath = path.join(__dirname, doc);
  const exists = checkFileExists(docPath);
  const size = checkFileSize(docPath);
  
  if (exists && size > 0) {
    log(`  ✓ ${doc} (${(size / 1024).toFixed(1)} KB)`, 'green');
  } else {
    log(`  ✗ ${doc} NOT FOUND or EMPTY`, 'yellow');
  }
});

// 6. Check tests
log('\n6. Checking Tests...', 'blue');
const testPath = path.join(__dirname, 'tests/ai-summary.test.js');
if (checkFileExists(testPath)) {
  const size = checkFileSize(testPath);
  log(`  ✓ ai-summary.test.js (${(size / 1024).toFixed(1)} KB)`, 'green');
} else {
  log('  ✗ ai-summary.test.js NOT FOUND', 'yellow');
}

// Summary
console.log('\n' + '='.repeat(60));
if (totalIssues === 0) {
  log('✓ ALL CHECKS PASSED - AI Integration is ready!', 'green');
  log('\nNext steps:', 'blue');
  log('  1. Load extension in Chrome (chrome://extensions)', 'reset');
  log('  2. Enable Chrome AI flags (chrome://flags)', 'reset');
  log('  3. Download Gemini Nano model (chrome://components)', 'reset');
  log('  4. Test on a product page (Amazon, eBay, etc.)', 'reset');
} else {
  log(`✗ FOUND ${totalIssues} ISSUE(S) - Please fix before deploying`, 'red');
  process.exit(1);
}
console.log('='.repeat(60) + '\n');
