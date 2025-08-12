/**
 * MessageBuilder for Side Service
 * 伴生服务端消息构建器，用于与设备端通信
 * 基于Zepp OS官方文档实现
 */

export class MessageBuilder {
  constructor(options = {}) {
    this.isConnected = false
    this.requestId = 0
    this.eventHandlers = new Map()
    this.connection = null
  }

  // 监听连接
  listen(callback) {
    try {
      // 在伴生服务中，连接是自动建立的
      this.isConnected = true
      console.log('伴生服务MessageBuilder监听已启动')
      
      if (callback) {
        callback()
      }
    } catch (error) {
      console.error('MessageBuilder监听失败:', error)
    }
  }

  // 发送消息到设备端
  call(data) {
    try {
      const message = {
        id: ++this.requestId,
        type: 'call',
        data: data
      }
      
      console.log('伴生服务发送消息到设备端:', message)
      
      // 在实际环境中，这里会通过蓝牙发送消息
      // 目前使用模拟实现
      this.sendMessage(message)
    } catch (error) {
      console.error('发送消息到设备端失败:', error)
    }
  }

  // 注册事件监听器
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
    console.log(`注册事件监听器: ${event}`)
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

  // 发送消息
  sendMessage(message) {
    try {
      const buffer = this.json2buf(message)
      // 在实际环境中，这里会通过蓝牙发送
      console.log('伴生服务发送消息:', message)
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }

  // 处理来自设备端的请求
  handleRequest(buffer, responseCallback) {
    try {
      const message = this.buf2Json(buffer)
      console.log('伴生服务收到设备端请求:', message)
      
      // 创建响应上下文
      const ctx = {
        request: {
          payload: buffer
        },
        response: (responseData) => {
          const response = {
            id: message.id,
            type: 'response',
            success: true,
            data: responseData
          }
          
          if (responseCallback) {
            responseCallback(response)
          }
        },
        error: (errorMessage) => {
          const response = {
            id: message.id,
            type: 'response',
            success: false,
            error: errorMessage
          }
          
          if (responseCallback) {
            responseCallback(response)
          }
        }
      }
      
      // 触发request事件
      this.emit('request', ctx)
    } catch (error) {
      console.error('处理设备端请求失败:', error)
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

  // 模拟接收设备端消息（用于测试）
  simulateDeviceMessage(data) {
    const message = {
      id: Date.now(),
      type: 'request',
      data: data
    }
    
    const buffer = this.json2buf(message)
    this.handleRequest(buffer, (response) => {
      console.log('伴生服务响应:', response)
    })
  }
}