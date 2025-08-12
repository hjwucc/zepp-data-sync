const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/' || req.url === '/index.html') {
    // 返回预览页面
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zepp OS 心率位置同步 - UI预览</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: white;
            font-family: 'Microsoft YaHei', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            display: flex;
            gap: 40px;
            align-items: flex-start;
        }
        .device {
            width: 320px;
            height: 302px;
            background: #000;
            border-radius: 50%;
            position: relative;
            border: 3px solid #333;
            overflow: hidden;
        }
        .screen {
            width: 100%;
            height: 100%;
            position: relative;
            border-radius: 50%;
        }
        .title {
            position: absolute;
            left: 0;
            top: 20px;
            width: 320px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
        }
        .switch-area {
            position: absolute;
            left: 20px;
            top: 70px;
            width: 280px;
            height: 80px;
            background: #2a2a2a;
            border-radius: 10px;
        }
        .switch-item {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            width: 260px;
            height: 30px;
        }
        .switch-item:first-child {
            top: 10px;
        }
        .switch-item:last-child {
            top: 45px;
        }
        .switch-label {
            font-size: 16px;
            color: white;
        }
        .switch {
            width: 50px;
            height: 24px;
            background: #51cf66;
            border-radius: 12px;
            position: relative;
        }
        .switch::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            top: 2px;
            right: 2px;
            transition: 0.3s;
        }
        .data-area {
            position: absolute;
            left: 20px;
            top: 160px;
            width: 280px;
            height: 90px;
            background: #2a2a2a;
            border-radius: 10px;
            padding: 10px;
            box-sizing: border-box;
        }
        .data-item {
            margin-bottom: 5px;
            font-size: 12px;
        }
        .heart-rate {
            color: #ff6b6b;
            font-size: 14px;
        }
        .location {
            color: #4dabf7;
        }
        .provider {
            color: #adb5bd;
        }
        .status-area {
            position: absolute;
            left: 30px;
            top: 265px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .status-icon {
            width: 12px;
            height: 12px;
            background: #51cf66;
            border-radius: 50%;
        }
        .status-text {
            font-size: 12px;
            color: white;
        }
        .settings-btn {
            position: absolute;
            right: 20px;
            top: 258px;
            width: 50px;
            height: 24px;
            background: #495057;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: white;
            cursor: pointer;
        }
        .sync-btn {
            position: absolute;
            left: 20px;
            top: 285px;
            width: 280px;
            height: 15px;
            background: #51cf66;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            cursor: pointer;
        }
        .info {
            max-width: 400px;
        }
        .info h2 {
            color: #51cf66;
            margin-top: 0;
        }
        .info ul {
            line-height: 1.6;
        }
        .info li {
            margin-bottom: 8px;
        }
        .highlight {
            color: #4dabf7;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="device">
            <div class="screen">
                <div class="title">心率位置同步</div>
                
                <div class="switch-area">
                    <div class="switch-item">
                        <span class="switch-label">心率同步</span>
                        <div class="switch"></div>
                    </div>
                    <div class="switch-item">
                        <span class="switch-label">位置同步</span>
                        <div class="switch"></div>
                    </div>
                </div>
                
                <div class="data-area">
                    <div class="data-item heart-rate">心率: 72 BPM</div>
                    <div class="data-item location">位置: 39.9042, 116.4074</div>
                    <div class="data-item provider">定位来源: GPS</div>
                </div>
                
                <div class="status-area">
                    <div class="status-icon"></div>
                    <span class="status-text">连接正常</span>
                </div>
                
                <div class="settings-btn">设置</div>
                <div class="sync-btn">立即同步</div>
            </div>
        </div>
        
        <div class="info">
            <h2>🎉 UI 标准化完成</h2>
            <p>根据 Zepp OS 开发文档，已完成以下UI优化：</p>
            <ul>
                <li><span class="highlight">布局规范化</span>：使用背景区域分组相关功能</li>
                <li><span class="highlight">颜色统一</span>：采用标准的颜色方案</li>
                <li><span class="highlight">圆角设计</span>：所有按钮和区域使用圆角</li>
                <li><span class="highlight">间距优化</span>：确保所有元素在320x302屏幕内</li>
                <li><span class="highlight">字体大小</span>：根据重要性调整字体大小</li>
                <li><span class="highlight">键盘输入</span>：设置页面支持键盘输入</li>
            </ul>
            
            <h3>主要改进：</h3>
            <ul>
                <li>开关控制区域添加背景分组</li>
                <li>数据显示区域独立背景</li>
                <li>状态显示更加紧凑</li>
                <li>按钮尺寸和位置优化</li>
                <li>设置页面支持 createKeyboard 输入</li>
            </ul>
            
            <h3>技术特性：</h3>
            <ul>
                <li>✅ 适配 Amazfit T-Rex 3 (320x302)</li>
                <li>✅ 心率和位置数据同步</li>
                <li>✅ 键盘输入支持</li>
                <li>✅ 错误处理和状态显示</li>
                <li>✅ 所有测试通过</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 预览服务器启动成功！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`🎨 查看更新后的 Zepp OS UI 效果`);
});