const EventEmitter = require('events');
const si = require('systeminformation');
const electronLog = require('electron-log');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');

class SystemMonitor extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.monitoringInterval = null;
    this.config = {
      interval: 30000, // 30 seconds
      thresholds: {
        cpu: 80, // 80%
        memory: 85, // 85%
        disk: 90, // 90%
        temperature: 70 // 70°C
      },
      alerts: {
        enabled: true,
        cooldown: 300000 // 5 minutes between same alerts
      }
    };
    
    this.logger = electronLog.scope('SystemMonitor');
    this.lastAlerts = new Map();
    this.systemInfo = {};
    this.performanceHistory = [];
    this.maxHistoryEntries = 100;
  }

  async initialize() {
    this.logger.info('Initializing System Monitor...');
    
    try {
      // Get initial system information
      await this.updateSystemInfo();
      
      this.logger.info('System Monitor initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize System Monitor:', error);
      throw error;
    }
  }

  start() {
    if (this.isRunning) {
      this.logger.warn('System Monitor is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting System Monitor...');
    
    // Start monitoring
    this.monitoringInterval = setInterval(() => {
      this.performMonitoring();
    }, this.config.interval);
    
    // Initial monitoring
    this.performMonitoring();
    
    this.logger.info(`System Monitor started with ${this.config.interval}ms interval`);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.logger.info('System Monitor stopped');
  }

  async performMonitoring() {
    try {
      const timestamp = new Date();
      
      // Get current performance data
      const [cpu, memory, disk, temperature, network] = await Promise.all([
        this.getCPUInfo(),
        this.getMemoryInfo(),
        this.getDiskInfo(),
        this.getTemperatureInfo(),
        this.getNetworkInfo()
      ]);

      const performanceData = {
        timestamp,
        cpu,
        memory,
        disk,
        temperature,
        network
      };

      // Add to history
      this.addToHistory(performanceData);
      
      // Check thresholds and send alerts
      this.checkThresholds(performanceData);
      
      // Emit performance update
      this.emit('performance-update', performanceData);
      
    } catch (error) {
      this.logger.error('Error during system monitoring:', error);
    }
  }

  async updateSystemInfo() {
    try {
      const [system, cpu, memory, osInfo, graphics, disk, network] = await Promise.all([
        si.system(),
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.graphics(),
        si.diskLayout(),
        si.networkInterfaces()
      ]);

      this.systemInfo = {
        system: {
          manufacturer: system.manufacturer,
          model: system.model,
          version: system.version,
          serial: system.serial,
          uuid: system.uuid
        },
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          family: cpu.family,
          model: cpu.model,
          speed: cpu.speed,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          processors: cpu.processors,
          cache: cpu.cache
        },
        memory: {
          total: memory.total,
          available: memory.available
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          codename: osInfo.codename,
          kernel: osInfo.kernel,
          arch: osInfo.arch,
          hostname: osInfo.hostname,
          fqdn: osInfo.fqdn
        },
        graphics: graphics.controllers.map(gpu => ({
          vendor: gpu.vendor,
          model: gpu.model,
          vram: gpu.vram,
          vramDynamic: gpu.vramDynamic
        })),
        disk: disk.map(d => ({
          type: d.type,
          name: d.name,
          vendor: d.vendor,
          size: d.size,
          interfaceType: d.interfaceType
        })),
        network: network.filter(n => !n.internal).map(n => ({
          iface: n.iface,
          type: n.type,
          speed: n.speed,
          mac: n.mac
        })),
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          uptime: process.uptime()
        }
      };

      this.logger.debug('System information updated');
    } catch (error) {
      this.logger.error('Failed to update system information:', error);
    }
  }

  async getCPUInfo() {
    try {
      const [currentLoad, temperature] = await Promise.all([
        si.currentLoad(),
        si.cpuTemperature()
      ]);

      return {
        usage: Math.round(currentLoad.currentLoad),
        user: Math.round(currentLoad.currentLoadUser),
        system: Math.round(currentLoad.currentLoadSystem),
        idle: Math.round(currentLoad.currentLoadIdle),
        temperature: temperature.main || 0,
        cores: currentLoad.cpus.map(core => ({
          usage: Math.round(core.load),
          user: Math.round(core.loadUser),
          system: Math.round(core.loadSystem),
          idle: Math.round(core.loadIdle)
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get CPU info:', error);
      return { usage: 0, user: 0, system: 0, idle: 100, temperature: 0, cores: [] };
    }
  }

  async getMemoryInfo() {
    try {
      const memory = await si.mem();
      
      return {
        total: memory.total,
        free: memory.free,
        used: memory.used,
        active: memory.active,
        available: memory.available,
        usage: Math.round((memory.used / memory.total) * 100),
        swap: {
          total: memory.swaptotal,
          used: memory.swapused,
          free: memory.swapfree,
          usage: memory.swaptotal > 0 ? Math.round((memory.swapused / memory.swaptotal) * 100) : 0
        }
      };
    } catch (error) {
      this.logger.error('Failed to get memory info:', error);
      return { total: 0, free: 0, used: 0, usage: 0, swap: { total: 0, used: 0, free: 0, usage: 0 } };
    }
  }

  async getDiskInfo() {
    try {
      const disks = await si.fsSize();
      
      return disks.map(disk => ({
        fs: disk.fs,
        type: disk.type,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        usage: Math.round(disk.use),
        mount: disk.mount
      }));
    } catch (error) {
      this.logger.error('Failed to get disk info:', error);
      return [];
    }
  }

  async getTemperatureInfo() {
    try {
      const [cpu, gpu] = await Promise.all([
        si.cpuTemperature(),
        si.graphics()
      ]);

      return {
        cpu: {
          main: cpu.main || 0,
          cores: cpu.cores || [],
          max: cpu.max || 0
        },
        gpu: gpu.controllers.map(controller => ({
          temperature: controller.temperatureGpu || 0
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get temperature info:', error);
      return { cpu: { main: 0, cores: [], max: 0 }, gpu: [] };
    }
  }

  async getNetworkInfo() {
    try {
      const [interfaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats()
      ]);

      const activeInterfaces = interfaces.filter(iface => !iface.internal && iface.operstate === 'up');
      
      return {
        interfaces: activeInterfaces.map(iface => ({
          iface: iface.iface,
          type: iface.type,
          speed: iface.speed,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          operstate: iface.operstate
        })),
        stats: stats.map(stat => ({
          iface: stat.iface,
          rx_bytes: stat.rx_bytes,
          tx_bytes: stat.tx_bytes,
          rx_sec: stat.rx_sec,
          tx_sec: stat.tx_sec
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get network info:', error);
      return { interfaces: [], stats: [] };
    }
  }

  addToHistory(performanceData) {
    this.performanceHistory.push(performanceData);
    
    // Keep only the latest entries
    if (this.performanceHistory.length > this.maxHistoryEntries) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistoryEntries);
    }
  }

  checkThresholds(data) {
    if (!this.config.alerts.enabled) {
      return;
    }

    const now = Date.now();
    
    // Check CPU usage
    if (data.cpu.usage > this.config.thresholds.cpu) {
      this.sendAlert('cpu', `High CPU usage: ${data.cpu.usage}%`, 'warning', now);
    }
    
    // Check memory usage
    if (data.memory.usage > this.config.thresholds.memory) {
      this.sendAlert('memory', `High memory usage: ${data.memory.usage}%`, 'warning', now);
    }
    
    // Check disk usage
    data.disk.forEach(disk => {
      if (disk.usage > this.config.thresholds.disk) {
        this.sendAlert('disk', `High disk usage on ${disk.mount}: ${disk.usage}%`, 'warning', now);
      }
    });
    
    // Check temperature
    if (data.temperature.cpu.main > this.config.thresholds.temperature) {
      this.sendAlert('temperature', `High CPU temperature: ${data.temperature.cpu.main}°C`, 'critical', now);
    }
  }

  sendAlert(type, message, severity, timestamp) {
    const alertKey = `${type}-${severity}`;
    const lastAlert = this.lastAlerts.get(alertKey);
    
    // Check cooldown period
    if (lastAlert && (timestamp - lastAlert) < this.config.alerts.cooldown) {
      return;
    }
    
    this.lastAlerts.set(alertKey, timestamp);
    
    const alert = {
      type,
      message,
      severity,
      timestamp: new Date(timestamp)
    };
    
    this.logger.warn(`System Alert [${severity.toUpperCase()}]: ${message}`);
    this.emit('system-alert', alert);
  }

  getSystemInfo() {
    return {
      ...this.systemInfo,
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      loadAverage: os.loadavg(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      tmpdir: os.tmpdir(),
      homedir: os.homedir()
    };
  }

  getPerformanceHistory(limit = 50) {
    return this.performanceHistory.slice(-limit);
  }

  getCurrentPerformance() {
    return this.performanceHistory.length > 0 
      ? this.performanceHistory[this.performanceHistory.length - 1]
      : null;
  }

  updateConfig(newConfig) {
    const oldInterval = this.config.interval;
    this.config = { ...this.config, ...newConfig };
    
    // If interval changed and monitoring is running, restart
    if (oldInterval !== this.config.interval && this.isRunning) {
      this.stop();
      this.start();
    }
    
    this.logger.info('System Monitor configuration updated');
  }

  getHealthStatus() {
    const current = this.getCurrentPerformance();
    if (!current) {
      return { status: 'unknown', issues: [] };
    }

    const issues = [];
    let status = 'healthy';

    // Check CPU
    if (current.cpu.usage > this.config.thresholds.cpu) {
      issues.push(`High CPU usage: ${current.cpu.usage}%`);
      status = 'warning';
    }

    // Check memory
    if (current.memory.usage > this.config.thresholds.memory) {
      issues.push(`High memory usage: ${current.memory.usage}%`);
      status = 'warning';
    }

    // Check disk
    current.disk.forEach(disk => {
      if (disk.usage > this.config.thresholds.disk) {
        issues.push(`High disk usage on ${disk.mount}: ${disk.usage}%`);
        status = 'warning';
      }
    });

    // Check temperature
    if (current.temperature.cpu.main > this.config.thresholds.temperature) {
      issues.push(`High CPU temperature: ${current.temperature.cpu.main}°C`);
      status = 'critical';
    }

    return { status, issues, timestamp: current.timestamp };
  }
}

module.exports = SystemMonitor;
