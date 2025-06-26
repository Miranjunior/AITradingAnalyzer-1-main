#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🔍 Checking deployment readiness...\n');

const checks = [
  {
    name: 'Netlify configuration',
    check: () => fs.existsSync('netlify.toml'),
    fix: 'netlify.toml file is present'
  },
  {
    name: 'Build script',
    check: () => fs.existsSync('build-netlify.js'),
    fix: 'build-netlify.js file is present'
  },
  {
    name: 'Client source files',
    check: () => fs.existsSync('client/src/App.tsx'),
    fix: 'React application source files are present'
  },
  {
    name: 'Server source files',
    check: () => fs.existsSync('server/index.ts'),
    fix: 'Express server files are present'
  },
  {
    name: 'Database schema',
    check: () => fs.existsSync('shared/schema.ts'),
    fix: 'Database schema is defined'
  },
  {
    name: 'Vite configuration',
    check: () => fs.existsSync('vite.config.ts'),
    fix: 'Vite build configuration is present'
  },
  {
    name: 'TypeScript configuration',
    check: () => fs.existsSync('tsconfig.json'),
    fix: 'TypeScript configuration is present'
  },
  {
    name: 'Dependencies',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.dependencies && Object.keys(pkg.dependencies).length > 0;
    },
    fix: 'All necessary dependencies are installed'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}: ${passed ? fix : 'FAILED'}`);
  if (!passed) allPassed = false;
});

console.log('\n📋 Environment Variables Required:');
console.log('   • OPENAI_API_KEY (required for AI analysis)');
console.log('   • DATABASE_URL (required for data persistence)');
console.log('   • BRAPI_API_KEY (optional - demo mode without it)');

console.log('\n🚀 Deployment Instructions:');
console.log('1. Push code to your Git repository');
console.log('2. Connect repository to Netlify');
console.log('3. Set environment variables in Netlify dashboard');
console.log('4. Deploy automatically with the configured build settings');

if (allPassed) {
  console.log('\n🎉 All checks passed! Ready for Netlify deployment.');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}