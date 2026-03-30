import { execSync } from 'child_process';
import process from 'process';

const PORT = process.env.PORT || 5000;

try {
  console.log(`🧹 Dọn dẹp port ${PORT}...`);
  
  // Get all processes using the port
  const output = execSync(`netstat -ano | findstr ":${PORT}"`, { encoding: 'utf-8' });
  const lines = output
    .split('\n')
    .filter(line => line.includes('LISTENING'))
    .map(line => line.trim());
  
  if (lines.length === 0) {
    console.log(`✅ Port ${PORT} đã trống`);
    process.exit(0);
  }

  // Extract PIDs and kill them
  const pids = new Set();
  lines.forEach(line => {
    const parts = line.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      pids.add(pid);
    }
  });

  pids.forEach(pid => {
    try {
      console.log(`⚔️ Giết process ${pid}...`);
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`✅ Đã kill process ${pid}`);
    } catch (err) {
      // Already killed
    }
  });

  console.log(`✅ Port ${PORT} đã sạch`);
} catch (error) {
  if (error.status === 1) {
    // No process found - port is free
    console.log(`✅ Port ${PORT} đã sạch`);
  } else {
    console.error('❌ Lỗi cleanup:', error.message);
  }
}
