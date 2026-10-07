#!/usr/bin/env node

import net from 'net';
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';

const program = new Command();

// Sık kullanılan kritik portlar ve servis tanımları
const COMMON_SERVICES = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  1433: 'MSSQL',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  6379: 'Redis',
  8080: 'HTTP-Proxy',
  27017: 'MongoDB'
};

program
  .name('portsentinel')
  .description('Fast and lightweight asynchronous TCP port scanner CLI')
  .version('1.0.0')
  .requiredOption('-t, --target <host>', 'Target IP address or domain (e.g. 127.0.0.1 or scanme.nmap.org)')
  .option('-p, --ports <range>', 'Port range to scan (e.g. "1-1000" or "80,443,3306")', 'common')
  .option('--timeout <ms>', 'Connection timeout in milliseconds', '1000');

program.parse(process.argv);
const options = program.opts();

// Tek bir port için TCP bağlantısı test fonksiyonu
function checkPort(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const responseTime = Date.now() - startTime;
      socket.destroy();
      resolve({ port, status: 'OPEN', latency: `${responseTime}ms` });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, status: 'CLOSED/FILTERED', latency: '-' });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ port, status: 'CLOSED', latency: '-' });
    });

    socket.connect(port, host);
  });
}

// Taranacak port listesini parse etme
function parsePorts(portArg) {
  if (portArg === 'common') {
    return Object.keys(COMMON_SERVICES).map(Number);
  }
  if (portArg.includes('-')) {
    const [start, end] = portArg.split('-').map(Number);
    const ports = [];
    for (let i = start; i <= end; i++) ports.push(i);
    return ports;
  }
  return portArg.split(',').map((p) => Number(p.trim())).filter(Boolean);
}

async function runScanner() {
  const target = options.target;
  const timeout = parseInt(options.timeout, 10);
  const portsToScan = parsePorts(options.ports);

  console.log(chalk.bold.cyan('\n🔍 PortSentinel TCP Network Scanner'));
  console.log(chalk.gray(`Target: ${chalk.white(target)} | Total Ports: ${chalk.white(portsToScan.length)} | Timeout: ${chalk.white(timeout + 'ms')}\n`));

  const spinner = ora('Scanning target ports asynchronously...').start();
  const startTime = Date.now();

  // Asenkron paralel tarama (chunk boyutlarıyla sınırlandırılabilir)
  const results = await Promise.all(
    portsToScan.map((port) => checkPort(target, port, timeout))
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  spinner.succeed(`Scan completed in ${chalk.green(duration + 's')}\n`);

  const openPorts = results.filter((r) => r.status === 'OPEN');

  if (openPorts.length === 0) {
    console.log(chalk.yellow('⚠️ No open ports discovered on target host.\n'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('PORT'),
      chalk.cyan('STATE'),
      chalk.cyan('SERVICE'),
      chalk.cyan('LATENCY')
    ],
    colWidths: [10, 12, 16, 12]
  });

  openPorts.forEach(({ port, status, latency }) => {
    const serviceName = COMMON_SERVICES[port] || 'Unknown';
    table.push([
      chalk.bold.white(port),
      chalk.bold.green(status),
      chalk.yellow(serviceName),
      chalk.gray(latency)
    ]);
  });

  console.log(table.toString());
  console.log(chalk.bold.green(`\n✅ ${openPorts.length} open port(s) detected.\n`));
}

runScanner();