#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building for Netlify deployment...');

try {
  // Build the client
  console.log('Building client...');
  execSync('vite build', { stdio: 'inherit' });

  // Build the server for Netlify Functions
  console.log('Building server for Netlify Functions...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outfile=dist/api.js', { stdio: 'inherit' });

  // Create Netlify Functions directory
  const functionsDir = 'dist/functions';
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  // Create Netlify Function wrapper
  const netlifyFunctionWrapper = `
import serverlessExpress from '@vendia/serverless-express';
import { app } from '../api.js';

export const handler = serverlessExpress({ app });
`;

  fs.writeFileSync(path.join(functionsDir, 'api.js'), netlifyFunctionWrapper);

  console.log('✅ Netlify build completed successfully!');
  console.log('📁 Client files: dist/public');
  console.log('⚡ Netlify Function: dist/functions/api.js');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}