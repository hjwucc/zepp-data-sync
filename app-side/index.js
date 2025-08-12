/**
 * Zepp OS 4.0 伴生服务
 * 负责网络数据传输和设置管理
 * 适配设备：Amazfit T-Rex 3
 */
import { BaseSideService } from '@zeppos/zml/base-side'
import { settingsLib } from '@zeppos/zml/base-side'
import { MessageBuilder } from '../shared/message-side'

// 创建MessageBuilder实例
const messageBuilder = new MessageBuilder()

/**
 * 获取存储的认证Token
 */
function getAuthToken() {
  return settingsLib.getItem('authToken') || 'your-api-token-here'
}

/**
 * 设置认证Token
 */
function setAuthToken(token) {
  settingsLib.setItem('authToken', token)
}

/**
 * 获取应用设置
 */
function getAppSettings() {
  try {
    const settings = settingsLib.getItem('appSettings')
    if (settings) {
      return JSON.parse(settings)
    }
    return {
      apiEndpoint: 'https://your-api-server.com/api/push',
      authToken: ''
    }
  } catch (error) {
    console.error('获取设置失败:', error)
    return {
      apiEndpoint: 'https://your-api-server.com/api/push',
      authToken: ''
    }
  }
}

/**
 * 保存应用设置
 */
function saveAppSettings(settings) {
  settingsLib.setItem('appSettings', JSON.stringify(settings))
}

/**
 * 发送数据到API
 * @param {Object} data 要发送的数据
 * @param {Function} res 响应回调
 */
async function sendDataToAPI(data, res) {
  try {
    const settings = getAppSettings()
    const token = getAuthToken()
    
    console.log('=== 开始发送数据到API ===');
    console.log('API端点:', settings.apiEndpoint);
    console.log('原始数据:', JSON.stringify(data, null, 2));
    
    // 根据API要求格式化数据：{"heart_rate":75,"location":{"lat":39.9042,"lng":116.4074}}
    let apiData;
    
    if (data.type === 'location') {
      // 处理位置数据：{type: 'location', latitude: xxx, longitude: xxx}
      apiData = {
        heart_rate: 75, // 默认心率值
        location: {
          lat: data.latitude || 39.9042,
          lng: data.longitude || 116.4074
        }
      }
    } else if (data.type === 'heartRate') {
      // 处理心率数据：{type: 'heartRate', value: xxx}
      apiData = {
        heart_rate: data.value || 75,
        location: {
          lat: 39.9042, // 默认位置
          lng: 116.4074
        }
      }
    } else {
      // 处理手动同步数据：{heartRate: xxx, location: {latitude: xxx, longitude: xxx}}
      apiData = {
        heart_rate: data.heartRate || data.value || 75,
        location: {
          lat: data.location?.latitude || data.latitude || 39.9042,
          lng: data.location?.longitude || data.longitude || 116.4074
        }
      }
    }
    
    console.log('数据类型:', data.type);
    console.log('数据结构检查:', {
      hasHeartRate: !!(data.heartRate || data.value),
      hasLocation: !!(data.location || (data.latitude && data.longitude)),
      dataKeys: Object.keys(data)
    });
    
    console.log('格式化后的API数据:', JSON.stringify(apiData, null, 2));
    
    // 严格参考 fetch-api 的请求逻辑
    const response = await fetch({
      url: settings.apiEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ZeppOS-HeartRateLocationSync/1.0'
      },
      body: JSON.stringify(apiData)
    })
    
    // 参考 fetch-api 的响应处理方式
    const resBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
    
    console.log('响应状态:', response.status)
    console.log('响应数据:', JSON.stringify(resBody))
    
    // 检查HTTP状态码
    if (response.status >= 200 && response.status < 300) {
      res(null, {
        success: true,
        result: resBody,
        status: response.status
      })
    } else {
      console.error('API响应错误:', response.status, resBody)
      res(null, {
        success: false,
        result: resBody,
        error: `HTTP ${response.status}: ${resBody?.message || '服务器响应错误'}`,
        status: response.status
      })
    }
  } catch (error) {
    console.error('网络请求异常:', error)
    res(null, {
      success: false,
      result: "ERROR",
      error: error.message || '网络请求失败'
    })
  }
}

/**
 * 获取测试数据
 * @param {Function} res 响应回调
 */
async function fetchTestData(res) {
  try {
    const response = await fetch({
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      method: 'GET'
    })
    
    const resBody = typeof response.body === 'string' ? 
      JSON.parse(response.body) : response.body

    res(null, {
      result: resBody
    })
  } catch (error) {
    console.error('获取测试数据失败:', error)
    res(null, {
      result: 'ERROR'
    })
  }
}

/**
 * 测试数据发送：直接请求指定的API接口
 * @param {Object} params 测试数据
 * @param {Function} res 响应回调
 */
async function testDataSendDirect(params, res) {
  try {
    const token = getAuthToken()
    const apiUrl = 'https://your-api-server.com/api/push'
    
    console.log('=== 测试发送：直接请求API ===');
    console.log('API端点:', apiUrl);
    console.log('测试数据:', JSON.stringify(params, null, 2));
    
    const response = await fetch({
      url: apiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ZeppOS-HeartRateLocationSync/1.0'
      },
      body: JSON.stringify({
        ...params,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          model: 'Amazfit T-Rex 3',
          os: 'ZeppOS 4.0'
        }
      })
    })
    
    const resBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
    
    console.log('测试发送响应状态:', response.status)
    console.log('测试发送响应数据:', JSON.stringify(resBody))
    
    res(null, {
      success: true,
      result: resBody,
      status: response.status
    })
  } catch (error) {
    console.error('测试发送异常:', error)
    res(null, {
      success: false,
      result: "ERROR",
      error: error.message || '测试发送失败'
    })
  }
}

/**
 * 测试网络连接
 * @param {Object} params 测试参数
 * @param {Function} res 响应回调
 */
async function testConnection(params, res) {
  try {
    const settings = getAppSettings()
    const token = getAuthToken()
    const testUrl = params?.apiUrl || settings.apiEndpoint
    
    console.log('开始测试连接:', testUrl)
    
    const requestBody = JSON.stringify({
      test: true,
      timestamp: new Date().toISOString(),
      message: '连接测试'
    })
    
    const response = await fetch({
      url: testUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: requestBody
    })
    
    console.log('测试连接响应状态:', response.status)
    
    if (response.status >= 200 && response.status < 300) {
      const responseBody = typeof response.body === 'string' ? 
        JSON.parse(response.body) : response.body
      
      res(null, {
        success: true,
        connected: true,
        data: responseBody
      })
    } else {
      res(null, {
        success: false,
        connected: false,
        error: `HTTP ${response.status}: ${response.body || '连接测试失败'}`
      })
    }
  } catch (error) {
    console.error('测试连接失败:', error)
    res(null, {
      success: false,
      connected: false,
      error: error.message || '网络连接失败'
    })
  }
}

/**
 * 检查网络状态
 * @param {Function} res 响应回调
 */
async function checkNetworkStatus(res) {
  try {
    const response = await fetch({
      url: 'https://www.baidu.com',
      method: 'GET'
    })
    
    const status = response.status >= 200 && response.status < 300 ? 'connected' : 'disconnected'
    console.log('网络状态:', status)
    
    res(null, {
      status: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.log('网络状态: 未连接')
    res(null, {
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// 注册伴生服务
AppSideService(
  BaseSideService({
    onInit() {
      console.log('心率位置同步伴生服务初始化')
      
      // 建立MessageBuilder连接
      messageBuilder.listen(() => {
        console.log('MessageBuilder连接已建立')
      })
      
      // 监听来自设备端的请求
      messageBuilder.on('request', (ctx) => {
        const payload = messageBuilder.buf2Json(ctx.request.payload)
        const { method, params } = payload
        
        console.log('收到设备端请求:', method)
        
        // 处理请求并响应
        this.handleDeviceRequest(method, params, (error, result) => {
          ctx.response({
            data: result || { error: error }
          })
        })
      })
    },

    // 设置变更时的回调
    onSettingsChange({ key, newValue, oldValue }) {
      console.log('设置发生变化:', { key, newValue, oldValue })
      
      if (key === 'appSettings' || key === 'apiUrl' || key === 'authToken') {
        // 获取最新的完整设置
        const settings = getAppSettings()
        
        // 通知设备应用设置已更新
        messageBuilder.call({
          method: 'SETTINGS_CHANGED',
          data: settings
        })
        
        console.log('已通知设备应用设置更新:', settings)
      }
    },

    // 处理来自设备端的请求
    handleDeviceRequest(method, params, callback) {
      console.log('处理设备端请求:', method)
      
      switch (method) {
        case 'GET_DATA':
          // 获取测试数据
          fetchTestData(callback)
          break
          
        case 'SEND_DATA':
        case 'SEND_HEART_RATE':
        case 'SEND_LOCATION':
        case 'MANUAL_SYNC':
          // 发送心率位置数据到API
          if (params) {
            sendDataToAPI(params, callback)
          } else {
            callback('缺少请求数据', null)
          }
          break
          
        case 'TEST_DATA_SEND':
          // 测试发送：直接请求指定的API接口
          testDataSendDirect(params, callback)
          break
          
        case 'TEST_CONNECTION':
          // 测试API连接
          testConnection(params, callback)
          break
          
        case 'CHECK_NETWORK':
          // 检查网络状态
          checkNetworkStatus(callback)
          break
          
        case 'GET_SETTINGS':
          // 获取应用设置
          callback(null, {
            success: true,
            settings: getAppSettings()
          })
          break
          
        case 'UPDATE_SETTINGS':
          // 更新应用设置
          if (params) {
            const currentSettings = getAppSettings()
            const newSettings = { ...currentSettings, ...params }
            saveAppSettings(newSettings)
            
            // 如果更新了Token，单独保存
            if (params.authToken) {
              setAuthToken(params.authToken)
            }
            
            callback(null, {
              success: true,
              settings: newSettings
            })
          } else {
            callback('缺少设置数据', null)
          }
          break
          
        default:
          console.log('未知请求方法:', method)
          callback('不支持的请求方法', null)
          break
      }
    },

    onRequest(req, res) {
      console.log('收到传统请求:', req.method)
      // 兼容传统请求方式
      this.handleDeviceRequest(req.method, req.params, (error, result) => {
        res(null, result || { error: error })
      })
    },

    onRun() {
      console.log('伴生服务运行中')
    },

    onDestroy() {
      console.log('伴生服务销毁')
    }
  })
)