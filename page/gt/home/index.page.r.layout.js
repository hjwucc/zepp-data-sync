/**
 * 圆形屏幕布局配置 (480x480)
 * 适配设备：Amazfit T-Rex 3 圆形屏幕
 */
import { px } from '@zos/utils'
import { getDeviceInfo } from '@zos/device'
import { align } from '@zos/ui'

// 获取设备尺寸信息
export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

// 导出布局样式常量
export const TEXT_STYLE = {
  x: px(42),
  y: px(200),
  w: DEVICE_WIDTH - px(42) * 2,
  h: px(80),
  color: 0xffffff,
  text_size: px(36),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text: '心率位置同步'
}

export const HEART_RATE_STYLE = {
  x: px(42),
  y: px(120),
  w: DEVICE_WIDTH - px(42) * 2,
  h: px(40),
  color: 0xff6b6b,
  text_size: px(28),
  align_h: align.CENTER_H,
  text: '-- BPM'
}

export const LOCATION_STYLE = {
  x: px(42),
  y: px(300),
  w: DEVICE_WIDTH - px(42) * 2,
  h: px(30),
  color: 0x4dabf7,
  text_size: px(20),
  align_h: align.CENTER_H,
  text: '--, --'
}