/**
 * Zepp OS 心率位置同步应用入口
 * 适配设备：Amazfit T-Rex 3
 * API版本：Zepp OS 4.0
 */
import './shared/device-polyfill'
import { MessageBuilder } from './shared/message'
import { BaseApp } from '@zeppos/zml/base-app'
import { getPackageInfo } from '@zos/app'
import { log as Logger } from '@zos/utils'
import * as ble from '@zos/ble'

const logger = Logger.getLogger('heart-rate-location-sync-app')

App(
  BaseApp({
    globalData: {
      messageBuilder: null
    },
    onCreate(options) {
      logger.log('app onCreate invoked')
      console.log('心率位置同步应用启动')
      
      try {
        // 建立连接
        const { appId } = getPackageInfo()
        const messageBuilder = new MessageBuilder({ appId, appDevicePort: 20, appSidePort: 0, ble })
        this.globalData.messageBuilder = messageBuilder
        messageBuilder.connect()
        logger.debug('MessageBuilder连接已建立')
      } catch (error) {
        logger.error('MessageBuilder初始化失败:', error)
      }
    },

    onDestroy(options) {
      logger.log('app onDestroy invoked')
      console.log('心率位置同步应用销毁')
      
      try {
        if (this.globalData.messageBuilder) {
          this.globalData.messageBuilder.disConnect()
          logger.debug('MessageBuilder连接已断开')
        }
      } catch (error) {
        logger.error('MessageBuilder断开连接失败:', error)
      }
    }
  })
)
