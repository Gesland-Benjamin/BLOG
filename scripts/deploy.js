#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
const environment = process.argv[2];
if (!['development', 'staging', 'production'].includes(environment)) throw new Error('Environnement explicite requis.');
const name = environment === 'development' ? 'blog-dev' : `blog-${environment}`;
// Aucun seed, reset, sync ni migration. Le schéma existant est conservé.
execFileSync('npm', ['ci', '--omit=dev'], { stdio: 'inherit' });
execFileSync('pm2', ['startOrRestart', 'ecosystem.config.cjs', '--only', name, '--env', environment], { stdio: 'inherit' });
console.log('Application redémarrée sans opération de schéma.');
