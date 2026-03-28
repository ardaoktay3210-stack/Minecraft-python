import { execSync } from 'child_process';
try {
  console.log(execSync('python3 --version').toString());
} catch (e) {
  console.log('python3 not found');
}
