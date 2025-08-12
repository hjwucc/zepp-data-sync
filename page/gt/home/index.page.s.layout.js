/**
 * 方形屏幕布局配置 (390x450)
 * 适配设备：Amazfit T-Rex 3 方形屏幕
 */
import { px } from '@zos/utils'

// 导出布局样式常量
export const TEXT_STYLE = {
  x: px(0),
  y: px(180),
  w: px(390),
  h: px(70),
  color: 0xffffff,
  text_size: px(32),
  align_h: 'center_h',
  align_v: 'center_v',
  text: '心率位置同步'
}

export const HEART_RATE_STYLE = {
  x: px(30),
  y: px(100),
  w: px(330),
  h: px(35),
  color: 0xff6b6b,
  text_size: px(24),
  align_h: 'center_h',
  text: '-- BPM'
}

export const LOCATION_STYLE = {
  x: px(30),
  y: px(280),
  w: px(330),
  h: px(25),
  color: 0x4dabf7,
  text_size: px(18),
  align_h: 'center_h',
  text: '--, --'
}