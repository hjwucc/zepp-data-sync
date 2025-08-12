import { createWidget, widget, align, prop, event } from '@zos/ui'
import { HeartRate, Geolocation, checkSensor } from '@zos/sensor'
import { localStorage } from '@zos/storage'
import { log as Logger } from '@zos/utils'
import { getDeviceInfo } from '@zos/device'
import { BasePage } from '@zeppos/zml/base-page'

const logger = Logger.getLogger('heart-rate-location-sync')
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

// 注释：BasePage内置了request方法，无需手动获取MessageBuilder

// 常量定义
const COLORS = {
  PRIMARY: 0x007acc,
  SUCCESS: 0x28a745,
  WARNING: 0xffc107,
  DANGER: 0xdc3545,
  WHITE: 0xffffff,
  GRAY: 0x666666
}

const LAYOUT = {
  MARGIN: 20,
  BUTTON_HEIGHT: 60,
  TEXT_HEIGHT: 40,
  SPACING: 15
}

Page(
  BasePage({
    // 页面状态
    state: {
      heartRate: null,
      location: null,
      isMonitoring: false,
      lastSyncTime: null,
      syncStatus: '未同步'
    },

    // 传感器实例
    sensors: {
      heartRate: null,
      geolocation: null
    },

    // UI 组件引用
    widgets: {},

    // 定时器引用
    timers: {
      locationDiagnosis: null
    },

    onInit() {
      logger.debug('页面初始化开始')
      try {
        // 加载设置
        this.loadSettings()
        
        logger.debug('页面初始化完成')
      } catch (error) {
        logger.error('页面初始化失败:', error)
      }
    },
    
    // 处理来自伴生服务的消息
    onCall(req) {
      logger.debug('收到伴生服务消息:', req)
      
      if (req.method === 'SETTINGS_CHANGED') {
        // 设置已更新，重新加载设置
        this.settings = {
          ...req.data,
          autoSync: true // 保持自动同步启用
        }
        
        // 保存到本地存储
        localStorage.setItem('appSettings', JSON.stringify(this.settings))
        
        logger.debug('设置已更新:', this.settings)
        
        // 更新状态显示
        this.updateStatusDisplay('设置已更新')
        
        // 显示通知
        if (this.widgets.statusLabel) {
          setTimeout(() => {
            this.updateStatusDisplay(this.state.syncStatus)
          }, 2000)
        }
      }
    },

  build() {
    logger.debug('设备应用页面构建开始')
    try {
      this.createUI()
      this.initSensors()
      logger.debug('页面构建完成')
    } catch (error) {
      logger.error('页面构建失败:', error)
    }
  },

  // 加载设置
  loadSettings() {
    try {
      const settings = localStorage.getItem('appSettings')
      if (settings) {
        this.settings = JSON.parse(settings)
        logger.debug('设置加载成功:', this.settings)
      } else {
        this.settings = {
          apiEndpoint: 'https://your-api-server.com/api/push',
          authToken: ''
        }
        localStorage.setItem('appSettings', JSON.stringify(this.settings))
      }
      
      // 硬编码自动同步为启用状态
      this.settings.autoSync = true
    } catch (error) {
      logger.error('设置加载失败:', error)
      this.settings = {
        apiEndpoint: 'https://your-api-server.com/api/push',
        authToken: ''
      }
      // 硬编码自动同步为启用状态
      this.settings.autoSync = true
    }
  },

  // 创建UI
  createUI() {
    let yPos = LAYOUT.MARGIN

    // 标题
    this.widgets.title = createWidget(widget.TEXT, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.TEXT_HEIGHT,
      text: '心率位置同步',
      text_size: 24,
      color: COLORS.WHITE,
      align_h: align.CENTER_H
    })
    yPos += LAYOUT.TEXT_HEIGHT + LAYOUT.SPACING

    // 心率显示
    this.widgets.heartRateLabel = createWidget(widget.TEXT, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.TEXT_HEIGHT,
      text: '心率: --',
      text_size: 18,
      color: COLORS.WHITE,
      align_h: align.CENTER_H
    })
    yPos += LAYOUT.TEXT_HEIGHT + LAYOUT.SPACING

    // 位置显示
    this.widgets.locationLabel = createWidget(widget.TEXT, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.TEXT_HEIGHT,
      text: '位置: --',
      text_size: 18,
      color: COLORS.WHITE,
      align_h: align.CENTER_H
    })
    yPos += LAYOUT.TEXT_HEIGHT + LAYOUT.SPACING

    // 状态显示
    this.widgets.statusLabel = createWidget(widget.TEXT, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.TEXT_HEIGHT,
      text: '状态: 未同步',
      text_size: 16,
      color: COLORS.GRAY,
      align_h: align.CENTER_H
    })
    yPos += LAYOUT.TEXT_HEIGHT + LAYOUT.SPACING

    // 定位状态显示
    this.widgets.locationStatusLabel = createWidget(widget.TEXT, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.TEXT_HEIGHT,
      text: '定位: 未初始化',
      text_size: 14,
      color: COLORS.WARNING,
      align_h: align.CENTER_H
    })
    yPos += LAYOUT.TEXT_HEIGHT + LAYOUT.SPACING * 2

    // 自动同步按钮
    this.widgets.monitorButton = createWidget(widget.BUTTON, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.BUTTON_HEIGHT,
      text: '自动同步',
      normal_color: COLORS.PRIMARY,
      press_color: COLORS.PRIMARY,
      radius: 8,
      click_func: () => this.toggleAutoSync()
    })
    yPos += LAYOUT.BUTTON_HEIGHT + LAYOUT.SPACING

    // 手动同步按钮
    this.widgets.syncButton = createWidget(widget.BUTTON, {
      x: LAYOUT.MARGIN,
      y: yPos,
      w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
      h: LAYOUT.BUTTON_HEIGHT,
      text: '手动同步',
      normal_color: COLORS.SUCCESS,
      press_color: COLORS.SUCCESS,
      radius: 8,
      click_func: () => this.manualSync()
    })
  },

  // 初始化传感器
  initSensors() {
    try {
      logger.debug('开始初始化传感器')
      
      // 检查并初始化心率传感器
      try {
        const heartRateAvailable = checkSensor(HeartRate)
        if (heartRateAvailable) {
          this.sensors.heartRate = new HeartRate()
          
          // 设置心率变化回调
          this.heartRateCallback = () => {
            const currentValue = this.sensors.heartRate.getCurrent()
            this.onHeartRateChange(currentValue)
          }
          
          this.sensors.heartRate.onCurrentChange(this.heartRateCallback)
          logger.debug('心率传感器初始化成功')
        } else {
          logger.error('心率传感器不可用')
          this.updateStatusDisplay('心率传感器不可用')
        }
      } catch (hrError) {
        logger.error('心率传感器初始化失败:', hrError)
        this.updateStatusDisplay('心率传感器初始化失败')
      }

      // 检查并初始化位置传感器
      try {
        const geolocationAvailable = checkSensor(Geolocation)
        if (geolocationAvailable) {
          this.sensors.geolocation = new Geolocation()
          
          // 检查用户是否允许定位功能 (API_LEVEL 4.0)
          const isEnabled = this.sensors.geolocation.getEnabled()
          if (!isEnabled) {
            logger.error('用户未授权定位功能')
            this.updateLocationStatusDisplay('权限未授权')
            return
          }
          
          // 设置位置变化回调
          this.locationCallback = () => {
            try {
              const status = this.sensors.geolocation.getStatus()
              logger.debug('当前定位状态:', status)
              
              if (status === 'A') {
                // 使用默认DD格式获取经纬度
                const latitude = this.sensors.geolocation.getLatitude({ format: 'DD' })
                const longitude = this.sensors.geolocation.getLongitude({ format: 'DD' })
                
                logger.debug('获取到位置数据:', { latitude, longitude })
                
                if (latitude && longitude && latitude !== 0 && longitude !== 0) {
                  this.onLocationChange({
                    latitude: latitude,
                    longitude: longitude
                  })
                  this.updateLocationStatusDisplay('定位成功')
                } else {
                  logger.debug('位置数据无效:', { latitude, longitude })
                  this.updateLocationStatusDisplay('位置数据无效')
                }
              } else if (status === 'V') {
                logger.debug('定位状态无效，正在搜索GPS信号...')
                this.updateLocationStatusDisplay('正在搜索GPS信号...')
              } else {
                logger.debug('未知定位状态:', status)
                this.updateLocationStatusDisplay('状态未知: ' + status)
              }
            } catch (callbackError) {
              logger.error('位置回调执行失败:', callbackError)
              this.updateLocationStatusDisplay('回调失败: ' + callbackError.message)
            }
          }
          
          // 注册用户定位授权状态变化监听
          this.enableChangeCallback = () => {
            const enabled = this.sensors.geolocation.getEnabled()
            logger.debug('定位授权状态变化:', enabled)
            if (!enabled) {
              this.updateLocationStatusDisplay('权限被禁用')
              this.stopAutoSync()
            }
          }
          this.sensors.geolocation.onEnableChange(this.enableChangeCallback)
          
          // 先注册回调，再启动传感器
          this.sensors.geolocation.onChange(this.locationCallback)
          
          // 获取当前定位设置信息（如果支持）
          try {
            if (this.sensors.geolocation.getSetting) {
              const setting = this.sensors.geolocation.getSetting()
              logger.debug('定位设置:', setting)
              const modeNames = ['精准模式', '智能模式', '均衡模式', '省电模式', '超级省电模式', '自定义模式']
              const modeName = modeNames[setting.mode] || '未知模式'
               this.updateLocationStatusDisplay('模式: ' + modeName)
            }
          } catch (settingError) {
            logger.debug('获取定位设置失败:', settingError)
          }
          
          logger.debug('位置传感器初始化成功')
           this.updateLocationStatusDisplay('已初始化，等待GPS信号...')
           
           // 延迟执行诊断，给传感器一些时间稳定
           setTimeout(() => {
             this.diagnoseLocationIssues()
           }, 2000)
        } else {
          logger.error('位置传感器不可用')
          this.updateLocationStatusDisplay('传感器不可用')
        }
      } catch (geoError) {
        logger.error('位置传感器初始化失败:', geoError)
        this.updateLocationStatusDisplay('初始化失败: ' + geoError.message)
      }

      logger.debug('传感器初始化完成')
    } catch (error) {
      logger.error('传感器初始化失败:', error)
      this.updateStatusDisplay('传感器初始化失败')
      this.updateLocationStatusDisplay('初始化失败')
    }
  },

  // 心率变化回调
  onHeartRateChange(value) {
    if (value && value >= 1 && value <= 199) {
      this.state.heartRate = value
      this.updateHeartRateDisplay(value)
      
      if (this.state.isMonitoring && this.settings.autoSync) {
        this.sendHeartRateData(value)
      }
    }
  },

  // 位置变化回调
  onLocationChange(data) {
    if (data && data.latitude && data.longitude) {
      this.state.location = {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: Date.now()
      }
      this.updateLocationDisplay(data)
      this.updateLocationStatusDisplay('位置已更新')
      
      if (this.state.isMonitoring && this.settings.autoSync) {
        this.sendLocationData(data)
      }
    }
  },

  // 更新心率显示
  updateHeartRateDisplay(value) {
    if (this.widgets.heartRateLabel) {
      this.widgets.heartRateLabel.setProperty(prop.TEXT, `心率: ${value} BPM`)
    }
  },

  // 更新位置显示
  updateLocationDisplay(data) {
    if (this.widgets.locationLabel) {
      const lat = data.latitude.toFixed(4)
      const lng = data.longitude.toFixed(4)
      this.widgets.locationLabel.setProperty(prop.TEXT, `位置: ${lat}, ${lng}`)
    }
  },

  // 更新状态显示
  updateStatusDisplay(status) {
    this.state.syncStatus = status
    if (this.widgets.statusLabel) {
      this.widgets.statusLabel.setProperty(prop.TEXT, `状态: ${status}`)
    }
  },

  // 更新定位状态显示
  updateLocationStatusDisplay(status) {
    if (this.widgets.locationStatusLabel) {
      this.widgets.locationStatusLabel.setProperty(prop.TEXT, `定位: ${status}`)
      
      // 根据状态设置不同颜色
      let color = COLORS.WARNING
      if (status.includes('成功') || status.includes('已初始化') || status.includes('已更新')) {
        color = COLORS.SUCCESS
      } else if (status.includes('失败') || status.includes('错误') || status.includes('禁用') || status.includes('无效')) {
        color = COLORS.DANGER
      } else if (status.includes('搜索') || status.includes('等待') || status.includes('启动')) {
        color = COLORS.WARNING
      }
      
      this.widgets.locationStatusLabel.setProperty(prop.COLOR, color)
    }
  },

  // 定位诊断方法
  diagnoseLocationIssues() {
    if (!this.sensors.geolocation) {
      this.updateLocationStatusDisplay('传感器未初始化')
      return
    }
    
    try {
      // 检查用户授权
      const isEnabled = this.sensors.geolocation.getEnabled()
      if (!isEnabled) {
        this.updateLocationStatusDisplay('需要授权定位权限')
        return
      }
      
      // 检查定位状态
      const status = this.sensors.geolocation.getStatus()
      logger.debug('定位诊断 - 当前状态:', status)
      
      if (status === 'V') {
        this.updateLocationStatusDisplay('GPS信号弱，请到室外')
      } else if (status === 'A') {
        // 尝试获取位置数据
        const lat = this.sensors.geolocation.getLatitude({ format: 'DD' })
        const lng = this.sensors.geolocation.getLongitude({ format: 'DD' })
        
        if (lat && lng && lat !== 0 && lng !== 0) {
          this.updateLocationStatusDisplay('定位正常')
        } else {
          this.updateLocationStatusDisplay('位置数据异常')
        }
      } else {
        this.updateLocationStatusDisplay('状态异常: ' + status)
      }
      
      // 获取定位设置（如果支持）
      if (this.sensors.geolocation.getSetting) {
        const setting = this.sensors.geolocation.getSetting()
        const modeNames = ['精准', '智能', '均衡', '省电', '超级省电', '自定义']
        const modeName = modeNames[setting.mode] || '未知'
        logger.debug('定位模式:', modeName)
      }
      
    } catch (error) {
      logger.error('定位诊断失败:', error)
      this.updateLocationStatusDisplay('诊断失败: ' + error.message)
    }
  },

   // 启动定位状态检查
   startLocationStatusCheck() {
     // 清除之前的定时器
     this.stopLocationStatusCheck()
     
     // 每10秒检查一次定位状态
     this.timers.locationDiagnosis = setInterval(() => {
       if (this.state.isMonitoring && this.sensors.geolocation) {
         this.diagnoseLocationIssues()
       }
     }, 10000)
     
     logger.debug('定位状态检查已启动')
   },

   // 停止定位状态检查
   stopLocationStatusCheck() {
     if (this.timers.locationDiagnosis) {
       clearInterval(this.timers.locationDiagnosis)
       this.timers.locationDiagnosis = null
       logger.debug('定位状态检查已停止')
     }
   },
 
    // 切换自动同步状态
  toggleAutoSync() {
    try {
      if (this.state.isMonitoring) {
        this.stopAutoSync()
      } else {
        this.startAutoSync()
      }
    } catch (error) {
      logger.error('切换自动同步状态失败:', error)
    }
  },

  // 开始自动同步
  startAutoSync() {
    try {
      logger.debug('尝试开始自动同步')
      
      // 检查传感器是否已初始化
      if (!this.sensors.heartRate || !this.sensors.geolocation) {
        logger.error('传感器未初始化，重新初始化')
        this.initSensors()
        
        // 等待传感器初始化完成再启动
        setTimeout(() => {
          this.startAutoSyncInternal()
        }, 1000)
      } else {
        // 即使传感器已初始化，也给一点时间确保稳定
        setTimeout(() => {
          this.startAutoSyncInternal()
        }, 200)
      }
    } catch (error) {
      logger.error('开始自动同步失败:', error)
      this.updateStatusDisplay('自动同步启动失败: ' + error.message)
    }
  },
  
  // 内部自动同步启动方法
  startAutoSyncInternal() {
    try {
      let heartRateReady = false
      let geolocationStarted = false
      
      // 心率传感器已经在初始化时注册了回调，无需start
      if (this.sensors.heartRate) {
        heartRateReady = true
        logger.debug('心率传感器已就绪')
      }
      
      // 启动位置传感器
      if (this.sensors.geolocation) {
        try {
          // 再次检查用户授权状态
          const isEnabled = this.sensors.geolocation.getEnabled()
          if (!isEnabled) {
            logger.error('用户未授权定位功能，无法启动位置传感器')
            this.updateLocationStatusDisplay('权限未授权')
          } else if (this.locationCallback) {
            // 确保回调已注册后再启动
            this.sensors.geolocation.start()
            geolocationStarted = true
            this.updateLocationStatusDisplay('已启动，等待信号...')
            logger.debug('位置传感器启动成功')
            
            // 启动后延迟诊断
            setTimeout(() => {
              this.diagnoseLocationIssues()
            }, 3000)
          } else {
            logger.error('位置传感器回调未注册')
          }
        } catch (geoError) {
          logger.error('位置传感器启动失败:', geoError)
          // 检查错误代码
            if (geoError.code === 1000) {
              logger.error('位置传感器错误代码1000: 可能是权限问题或传感器不可用')
              this.updateLocationStatusDisplay('权限被拒绝或不可用')
            } else {
              this.updateLocationStatusDisplay('启动失败: ' + geoError.message)
            }
        }
      }
      
      if (heartRateReady || geolocationStarted) {
        this.state.isMonitoring = true
        this.widgets.monitorButton.setProperty(prop.TEXT, '停止自动同步')
        this.updateStatusDisplay('自动同步中')
        
        // 启动定期定位状态检查
        if (geolocationStarted) {
          this.startLocationStatusCheck()
        }
        
        logger.debug('自动同步启动成功')
      } else {
        this.updateStatusDisplay('传感器启动失败')
        logger.error('所有传感器启动失败')
      }
    } catch (error) {
      logger.error('内部自动同步启动失败:', error)
      this.updateStatusDisplay('自动同步启动失败: ' + error.message)
    }
  },

  // 停止自动同步
  stopAutoSync() {
    try {
      // 心率传感器取消回调（如果需要的话，这里可以保留回调继续运行）
      if (this.sensors.heartRate) {
        logger.debug('心率传感器回调保持活跃')
      }
      
      // 停止位置传感器
      if (this.sensors.geolocation) {
        try {
          this.sensors.geolocation.stop()
          this.updateLocationStatusDisplay('已停止')
          logger.debug('位置传感器停止成功')
        } catch (geoError) {
          logger.error('位置传感器停止失败:', geoError)
          this.updateLocationStatusDisplay('停止失败')
        }
      }
      
      this.state.isMonitoring = false
      this.widgets.monitorButton.setProperty(prop.TEXT, '自动同步')
      this.updateStatusDisplay('已停止')
      
      // 停止定期检查
      this.stopLocationStatusCheck()
      
      logger.debug('停止自动同步')
    } catch (error) {
      logger.error('停止自动同步失败:', error)
    }
  },

  // 发送心率数据
  sendHeartRateData(heartRate) {
    const data = {
      type: 'heartRate',
      value: heartRate,
      timestamp: Date.now(),
      deviceId: getDeviceInfo().deviceName || 'unknown'
    }
    
    try {
      this.request({
        method: 'SEND_HEART_RATE',
        params: data
      })
      .then((result) => {
        if (result.success && result.result) {
          logger.debug('心率数据发送成功')
          // 显示API返回的数据
          const responseText = JSON.stringify(result.result)
          this.displayApiResponse(responseText)
          this.updateStatusDisplay('心率已同步')
        } else {
          const errorMsg = result.error || '未知错误'
          logger.error('心率数据发送失败:', errorMsg)
          this.updateStatusDisplay(`心率同步失败: ${errorMsg}`)
        }
      })
      .catch((error) => {
        const errorMsg = error.message || error || '网络异常'
        logger.error('心率数据发送异常:', errorMsg)
        this.updateStatusDisplay(`心率发送异常: ${errorMsg}`)
      })
    } catch (error) {
      logger.error('发送心率数据失败:', error)
      this.updateStatusDisplay('心率发送失败')
    }
  },

  // 发送位置数据
  sendLocationData(location) {
    const data = {
      type: 'location',
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now(),
      deviceId: getDeviceInfo().deviceName || 'unknown'
    }
    
    logger.debug('准备发送位置数据:', JSON.stringify(data))
    
    try {
      this.request({
        method: 'SEND_LOCATION',
        params: data
      })
      .then((result) => {
        if (result.success && result.result) {
          logger.debug('位置数据发送成功')
          // 显示API返回的数据
          const responseText = JSON.stringify(result.result)
          this.displayApiResponse(responseText)
          this.updateStatusDisplay('位置已同步')
        } else {
          const errorMsg = result.error || '未知错误'
          logger.error('位置数据发送失败:', errorMsg)
          this.updateStatusDisplay(`位置同步失败: ${errorMsg}`)
        }
      })
      .catch((error) => {
        const errorMsg = error.message || error || '网络异常'
        logger.error('位置数据发送异常:', errorMsg)
        this.updateStatusDisplay(`位置发送异常: ${errorMsg}`)
      })
    } catch (error) {
      logger.error('发送位置数据失败:', error)
      this.updateStatusDisplay('位置发送失败')
    }
  },

  // 发送数据到API
  sendDataToAPI(data) {
    try {
      this.request({
        method: 'SEND_DATA',
        params: data
      })
      .then((result) => {
        if (result.success) {
          this.updateStatusDisplay('同步成功')
          this.state.lastSyncTime = Date.now()
        } else {
          this.updateStatusDisplay('同步失败')
        }
      })
      .catch((error) => {
        logger.error('数据发送失败:', error)
        this.updateStatusDisplay('发送失败')
      })
    } catch (error) {
      logger.error('发送数据到API失败:', error)
      this.updateStatusDisplay('发送错误')
    }
  },

  // 手动同步
  manualSync() {
    try {
      this.updateStatusDisplay('正在获取传感器数据...')
      
      // 获取当前心率数据
      let currentHeartRate = null
      if (this.sensors.heartRate) {
        try {
          currentHeartRate = this.sensors.heartRate.getCurrent()
          logger.debug('获取到当前心率:', currentHeartRate)
        } catch (hrError) {
          logger.error('获取心率失败:', hrError)
        }
      }
      
      // 获取当前位置数据
      let currentLocation = null
      if (this.sensors.geolocation) {
        try {
          const status = this.sensors.geolocation.getStatus()
          if (status === 'A') {
            const latitude = this.sensors.geolocation.getLatitude({ format: 'DD' })
            const longitude = this.sensors.geolocation.getLongitude({ format: 'DD' })
            if (latitude && longitude && latitude !== 0 && longitude !== 0) {
              currentLocation = { latitude, longitude }
              logger.debug('获取到当前位置:', currentLocation)
            }
          } else {
            logger.debug('GPS状态无效:', status)
          }
        } catch (geoError) {
          logger.error('获取位置失败:', geoError)
        }
      }
      
      // 使用获取到的数据或默认值
      const heartRate = currentHeartRate || this.state.heartRate || 75
      const location = currentLocation || this.state.location || { latitude: 39.9042, longitude: 116.4074 }
      
      const syncData = {
        heartRate: heartRate,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        timestamp: Date.now(),
        deviceId: getDeviceInfo().deviceName || 'unknown'
      }
      
      logger.debug('手动同步数据:', JSON.stringify(syncData))
       
       // 显示数据获取状态
       let statusMsg = '手动同步: '
       if (currentHeartRate) {
         statusMsg += `心率${currentHeartRate} `
       } else {
         statusMsg += '心率(默认) '
       }
       if (currentLocation) {
         statusMsg += '位置(实时)'
       } else {
         statusMsg += '位置(默认)'
       }
       this.updateStatusDisplay(statusMsg)
       
       this.request({
         method: 'MANUAL_SYNC',
         params: syncData
       })
       .then((result) => {
         if (result.success && result.result) {
           logger.debug('手动同步成功')
           // 显示API返回的数据
           const responseText = JSON.stringify(result.result)
           this.displayApiResponse(responseText)
           this.updateStatusDisplay('手动同步成功')
         } else {
           logger.error('手动同步失败:', result.error)
           this.updateStatusDisplay('同步失败: ' + (result.error || '未知错误'))
         }
       })
       .catch((error) => {
         logger.error('手动同步异常:', error)
         this.updateStatusDisplay('同步失败: ' + (error.message || error))
       })
       
       logger.debug('手动同步执行')
     } catch (error) {
       logger.error('手动同步失败:', error)
       this.updateStatusDisplay('同步失败: ' + (error.message || error))
     }
   },

  // 显示API响应数据（参考fetch-api的实现）
  displayApiResponse(responseText) {
    if (!this.widgets.responseText) {
      // 创建响应显示组件
      this.widgets.responseText = createWidget(widget.TEXT, {
        x: LAYOUT.MARGIN,
        y: DEVICE_HEIGHT - 150,
        w: DEVICE_WIDTH - LAYOUT.MARGIN * 2,
        h: 100,
        text: responseText,
        text_size: 12,
        color: COLORS.WHITE,
        align_h: align.LEFT,
        align_v: align.TOP
      })
    } else {
      this.widgets.responseText.setProperty(prop.TEXT, responseText)
    }
  },

  onDestroy() {
    logger.debug('页面资源清理开始')
    try {
      // 停止定位状态检查定时器
      this.stopLocationStatusCheck()
      
      // 清理心率传感器回调
      if (this.sensors.heartRate) {
        // 心率传感器使用offCurrentChange取消回调
        if (this.heartRateCallback) {
          this.sensors.heartRate.offCurrentChange(this.heartRateCallback)
        }
        logger.debug('心率传感器回调已清理')
      }
      
      // 停止并清理位置传感器
      if (this.sensors.geolocation) {
        this.sensors.geolocation.stop()
        if (this.locationCallback) {
          this.sensors.geolocation.offChange(this.locationCallback)
        }
        if (this.enableChangeCallback) {
          this.sensors.geolocation.offEnableChange(this.enableChangeCallback)
        }
        logger.debug('位置传感器已停止并清理')
      }
      
      logger.debug('页面资源清理完成')
    } catch (error) {
      logger.error('页面资源清理失败:', error)
    }
  }
  })
)