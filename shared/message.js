/**
 * MessageBuilder for Device App
 * 设备端消息构建器，用于与伴生服务通信
 * 基于Zepp OS官方文档实现
 */

export class MessageBuilder {
  constructor(options = {}) {
    this.appId = options.appId
    this.appDevicePort = options.appDevicePort || 20
    this.appSidePort = options.appSidePort || 0
    this.ble = options.ble
    this.isConnected = false
    this.requestId = 0
    this.pendingRequests = new Map()
    this.eventHandlers = new Map()
  }

  // 建立连接
  connect() {
    try {
      if (this.ble && this.ble.createConnect) {
        this.connection = this.ble.createConnect({
          appId: this.appId,
          appDevicePort: this.appDevicePort,
          appSidePort: this.appSidePort,
          onInit: () => {
            console.log('BLE连接初始化成功')
            this.isConnected = true
          },
          onConnect: () => {
            console.log('BLE连接建立成功')
            this.isConnected = true
          },
          onDisconnect: () => {
            console.log('BLE连接断开')
            this.isConnected = false
          },
          onReceiveMessage: (data) => {
            this.handleMessage(data)
          }
        })
      } else {
        // 模拟连接用于测试
        console.log('使用模拟连接模式')
        this.isConnected = true
      }
    } catch (error) {
      console.error('MessageBuilder连接失败:', error)
    }
  }

  // 断开连接
  disConnect() {
    try {
      if (this.connection && this.connection.disConnect) {
        this.connection.disConnect()
      }
      this.isConnected = false
      this.pendingRequests.clear()
      console.log('MessageBuilder连接已断开')
    } catch (error) {
      console.error('MessageBuilder断开连接失败:', error)
    }
  }

  // 发送请求到伴生服务
  request(data) {
    return new Promise((resolve, reject) => {
      // 如果连接未建立，尝试建立连接
      if (!this.isConnected) {
        console.log('连接未建立，尝试建立连接...')
        this.connect()
        // 给连接一点时间建立
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('连接建立失败，使用模拟模式')
            this.isConnected = true // 强制设置为已连接，使用模拟模式
          }
          this.performRequest(data, resolve, reject)
        }, 100)
      } else {
        this.performRequest(data, resolve, reject)
      }
    })
  }

  // 执行实际的请求
  performRequest(data, resolve, reject) {
    const requestId = ++this.requestId
    const message = {
      id: requestId,
      type: 'request',
      data: data
    }

    // 存储待处理的请求
    this.pendingRequests.set(requestId, { resolve, reject })

    // 设置超时
    setTimeout(() => {
      if (this.pendingRequests.has(requestId)) {
        this.pendingRequests.delete(requestId)
        reject(new Error('请求超时'))
      }
    }, 10000) // 10秒超时

    try {
      this.sendMessage(message)
    } catch (error) {
      this.pendingRequests.delete(requestId)
      reject(error)
    }
  }

  // 发送消息
  sendMessage(message) {
    try {
      const buffer = this.json2buf(message)
      if (this.connection && this.connection.send) {
        this.connection.send(buffer)
      } else {
        // 模拟发送用于测试
        console.log('模拟发送消息:', message)
        // 模拟伴生服务响应
        setTimeout(() => {
          this.simulateResponse(message)
        }, 100)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  // 处理接收到的消息
  handleMessage(buffer) {
    try {
      const message = this.buf2Json(buffer)
      
      if (message.type === 'response' && message.id) {
        // 处理响应
        const pending = this.pendingRequests.get(message.id)
        if (pending) {
          this.pendingRequests.delete(message.id)
          if (message.success) {
            pending.resolve(message.data)
          } else {
            // 如果有详细的错误信息，保持原始结构
            if (message.errorDetails) {
              pending.reject(message.errorDetails)
            } else {
              pending.reject({
                error: 'REQUEST_FAILED',
                message: message.error || '请求失败'
              })
            }
          }
        }
      } else if (message.type === 'call') {
        // 处理来自伴生服务的调用
        this.emit('call', { payload: buffer })
      }
    } catch (error) {
      console.error('处理消息失败:', error)
    }
  }

  // 模拟伴生服务响应（用于测试）
  simulateResponse(originalMessage) {
    console.log('模拟处理请求:', originalMessage)
    
    let response = {
      id: originalMessage.id,
      type: 'response',
      success: false,
      error: '模拟模式：请启动真实的伴生服务'
    }
    
    if (originalMessage.data && originalMessage.data.method) {
      const method = originalMessage.data.method
      console.log('模拟处理方法:', method)
      
      switch (method) {
        case 'TEST_CONNECTION':
          console.log('模拟测试连接请求')
          
          // 模拟网络请求
          const testData = originalMessage.data.data
          const apiUrl = testData.apiUrl || 'https://your-api-server.com/api/push'
          const token = testData.token
          
          console.log('模拟连接到:', apiUrl)
          console.log('使用Token:', token ? '***已设置***' : '未设置')
          
          // 模拟不同的响应情况
          if (!token || token.trim() === '') {
            response = {
              id: originalMessage.id,
              type: 'response',
              success: false,
              errorDetails: {
                error: 'AUTH_FAILED',
                message: 'Token认证失败',
                statusCode: 401
              }
            }
          } else if (!apiUrl || !apiUrl.startsWith('http')) {
            response = {
              id: originalMessage.id,
              type: 'response',
              success: false,
              errorDetails: {
                error: 'BAD_REQUEST',
                message: '无效的API URL',
                statusCode: 400
              }
            }
          } else {
            // 模拟成功响应
            response = {
              id: originalMessage.id,
              type: 'response',
              success: true,
              data: {
                status: 'success',
                message: '连接成功（模拟模式）',
                url: apiUrl,
                timestamp: new Date().toISOString(),
                duration: 150,
                response: {
                  status: 200,
                  body: {
                    result: 'success',
                    message: '模拟API响应'
                  }
                }
              }
            }
          }
          break
          
        case 'TEST_DATA_SEND':
          console.log('模拟测试数据发送请求')
          const testParams = originalMessage.data.params
          console.log('测试数据:', testParams)
          
          // 模拟成功的测试数据发送
          response = {
            id: originalMessage.id,
            type: 'response',
            success: true,
            data: {
              status: 'success',
              message: '测试数据发送成功（模拟模式）',
              timestamp: new Date().toISOString(),
              duration: 120,
              sentData: testParams,
              response: {
                status: 200,
                body: {
                  result: 'success',
                  message: '测试数据已接收',
                  dataId: 'test_' + Date.now()
                }
              }
            }
          }
          break
          
        case 'MANUAL_SYNC':
          console.log('模拟手动同步请求')
          const syncParams = originalMessage.data.params
          console.log('同步数据:', syncParams)
          
          // 模拟成功的手动同步
          response = {
            id: originalMessage.id,
            type: 'response',
            success: true,
            data: {
              status: 'success',
              message: '手动同步成功（模拟模式）',
              timestamp: new Date().toISOString(),
              duration: 200,
              syncedData: syncParams,
              response: {
                status: 200,
                body: {
                  result: 'success',
                  message: '数据同步完成',
                  syncId: 'sync_' + Date.now()
                }
              }
            }
          }
          break
          
        case 'SEND_HEART_RATE':
        case 'SEND_LOCATION':
        case 'SEND_DATA':
          console.log('模拟数据发送请求:', method)
          const sendParams = originalMessage.data.params
          console.log('发送数据:', sendParams)
          
          // 模拟成功的数据发送
          response = {
            id: originalMessage.id,
            type: 'response',
            success: true,
            data: {
              status: 'success',
              message: '数据发送成功（模拟模式）',
              timestamp: new Date().toISOString(),
              duration: 150,
              sentData: sendParams,
              response: {
                status: 200,
                body: {
                  result: 'success',
                  message: '数据已接收',
                  dataId: 'data_' + Date.now()
                }
              }
            }
          }
          break
          
        case 'GET_DATA':
          console.log('模拟获取数据请求')
          
          // 模拟获取测试数据
          response = {
            id: originalMessage.id,
            type: 'response',
            success: true,
            data: {
              result: {
                userId: 1,
                id: 1,
                title: 'delectus aut autem',
                completed: false
              }
            }
          }
          break
          
        default:
          console.log('未知的请求方法:', method)
          response = {
            id: originalMessage.id,
            type: 'response',
            success: false,
            error: `模拟模式：不支持的方法 ${method}`
          }
          break
      }
    }
    
    const buffer = this.json2buf(response)
    this.handleMessage(buffer)
  }

  // 注册事件监听器
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
  }

  // 触发事件
  emit(event, data) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`事件处理器错误 (${event}):`, error)
        }
      })
    }
  }

  // JSON转Buffer
  json2buf(json) {
    try {
      const str = JSON.stringify(json)
      const buffer = new ArrayBuffer(str.length * 2)
      const view = new Uint16Array(buffer)
      for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i)
      }
      return buffer
    } catch (error) {
      console.error('JSON转Buffer失败:', error)
      throw error
    }
  }

  // Buffer转JSON
  buf2Json(buffer) {
    try {
      const view = new Uint16Array(buffer)
      let str = ''
      for (let i = 0; i < view.length; i++) {
        if (view[i] === 0) break
        str += String.fromCharCode(view[i])
      }
      return JSON.parse(str)
    } catch (error) {
      console.error('Buffer转JSON失败:', error)
      throw error
    }
  }

  // 监听连接（兼容性方法）
  listen(callback) {
    if (callback) {
      callback()
    }
  }

  // 调用伴生服务（兼容性方法）
  call(data) {
    return this.request(data)
  }
}