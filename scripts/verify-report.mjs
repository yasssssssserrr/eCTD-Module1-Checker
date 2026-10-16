import fs from 'node:fs';
import crypto from 'node:crypto';
const filename=process.argv[2];
if(!filename)throw new Error('Usage: node scripts/verify-report.mjs <report.json>');
const report=JSON.parse(fs.readFileSync(filename,'utf8'));
const {reportSha256,...payload}=report;
const actual=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
if(actual!==reportSha256){console.error('FAIL: report payload digest does not match.');process.exitCode=1;}
else console.log('Payload digest matches. This is not a signature or organizational release approval.');
