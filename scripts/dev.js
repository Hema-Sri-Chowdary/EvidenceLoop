import { spawn } from 'child_process';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m[EvidenceLoop]\x1b[0m Starting Server & Client in development mode...\n');

const server = spawn(npmCmd, ['--prefix', 'server', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

const client = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

const cleanExit = () => {
  try {
    server.kill();
  } catch {}
  try {
    client.kill();
  } catch {}
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);

server.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31m[EvidenceLoop Server exited with code ${code}]\x1b[0m`);
  }
});

client.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31m[EvidenceLoop Client exited with code ${code}]\x1b[0m`);
  }
});
