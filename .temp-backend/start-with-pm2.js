const { spawn } = require('child_process');
const path = require('path');

console.log('启动后端服务 (带自动重启)...');

// 检查是否安装了pm2
const checkPM2 = () => {
    return new Promise((resolve) => {
        const pm2Check = spawn('pm2', ['--version'], { shell: true });
        pm2Check.on('close', (code) => {
            resolve(code === 0);
        });
        pm2Check.on('error', () => {
            resolve(false);
        });
    });
};

// 安装pm2
const installPM2 = () => {
    return new Promise((resolve, reject) => {
        console.log('正在安装PM2...');
        const install = spawn('npm', ['install', '-g', 'pm2'], { shell: true });
        
        install.on('close', (code) => {
            if (code === 0) {
                console.log('PM2安装成功');
                resolve();
            } else {
                reject(new Error('PM2安装失败'));
            }
        });
        
        install.on('error', reject);
    });
};

// 启动服务
const startService = async () => {
    try {
        const hasPM2 = await checkPM2();
        
        if (!hasPM2) {
            console.log('PM2未安装，正在安装...');
            await installPM2();
        }
        
        console.log('使用PM2启动后端服务...');
        
        // 停止可能存在的旧进程
        spawn('pm2', ['delete', 'player-backend'], { shell: true });
        
        // 启动新进程
        const pm2Start = spawn('pm2', ['start', 'ecosystem.config.js'], { 
            shell: true,
            stdio: 'inherit'
        });
        
        pm2Start.on('close', (code) => {
            if (code === 0) {
                console.log('后端服务启动成功！');
                console.log('服务地址: http://localhost:3001');
                console.log('健康检查: http://localhost:3001/health');
                console.log('');
                console.log('PM2命令:');
                console.log('  pm2 status          - 查看服务状态');
                console.log('  pm2 logs player-backend - 查看日志');
                console.log('  pm2 restart player-backend - 重启服务');
                console.log('  pm2 stop player-backend - 停止服务');
            } else {
                console.error('启动失败');
            }
        });
        
    } catch (error) {
        console.error('启动服务时出错:', error);
        console.log('回退到普通启动模式...');
        
        // 回退到普通启动
        const normalStart = spawn('node', ['index.js'], { 
            stdio: 'inherit'
        });
        
        normalStart.on('error', (err) => {
            console.error('普通启动也失败:', err);
        });
    }
};

startService();
