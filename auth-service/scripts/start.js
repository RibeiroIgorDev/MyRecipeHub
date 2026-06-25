const { spawn, execSync } = require('child_process');

const port = process.env.PORT || 3001;

function clearPort(portNumber) {
  if (process.platform !== 'win32') return;

  const command = `powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort ${portNumber} -State Listen -ErrorAction SilentlyContinue; if ($conns) { $conns | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"`;

  try {
    execSync(command, { stdio: 'ignore' });
  } catch {
    // Ignore cleanup failures and continue.
  }
}

clearPort(port);

const child = spawn(process.execPath, ['src/server.js'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
