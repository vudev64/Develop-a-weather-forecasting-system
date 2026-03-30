import { execSync } from 'child_process';

const PORT = process.argv[2] || 5000;

console.log(`🔥 Kill port ${PORT}...`);

try {
  const output = execSync(`netstat -ano | findstr ":${PORT}"`, { 
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const pids = new Set();
  output.split('\n')
    .filter(line => line.includes('LISTENING'))
    .forEach(line => {
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    });

  if (pids.size === 0) {
    console.log(`✅ Port ${PORT} trống`);
    process.exit(0);
  }

  pids.forEach(pid => {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`✅ Kill PID ${pid}`);
    } catch (e) {}
  });

  console.log(`✅ Port ${PORT} đã free`);
} catch (error) {
  console.log(`✅ Port ${PORT} không bị chiếm`);
}
