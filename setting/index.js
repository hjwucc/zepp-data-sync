/**
 * Zepp OS 4.0 心率位置同步设置应用 - 简化版
 * 运行在Zepp App中，仅配置API地址和认证Token
 * 适配设备：Amazfit T-Rex 3
 */

AppSettingsPage({
  state: {
    apiUrl: 'https://your-api-server.com/api/push',
    authToken: 'your-api-token-here'
  },

  onInit() {
    console.log('心率位置同步设置应用初始化')
  },

  build(props) {
    console.log('构建设置界面')
    
    // 加载已保存的设置
    this.loadSettings(props)
    
    // 返回设置界面组件
    return this.renderSettingsUI(props)
  },

  /**
   * 加载已保存的设置
   */
  loadSettings(props) {
    try {
      const storage = props.settingsStorage
      
      // 从存储中获取设置，如果不存在则使用默认值
      this.state.apiUrl = storage.getItem('apiUrl') || this.state.apiUrl
      this.state.authToken = storage.getItem('authToken') || this.state.authToken
      
      console.log('设置加载完成:', this.state)
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  },

  /**
   * 渲染设置界面 - 苹果风格设计
   */
  renderSettingsUI(props) {
    return [
      // 页面标题
      View({
        style: {
          textAlign: 'center',
          marginBottom: '32px',
          paddingTop: '20px'
        }
      }, [
        Text({
          value: '数据同步配置',
          style: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#1d1d1f',
            marginBottom: '8px',
            display: 'block'
          }
        }),
        Text({
          value: '配置您的API服务器信息以启用数据同步功能',
          style: {
            fontSize: '16px',
            color: '#86868b',
            lineHeight: '1.4',
            display: 'block'
          }
        })
      ]),

      // API配置分组
      View({
        style: {
          backgroundColor: '#f2f2f7',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }
      }, [
        // 分组标题
        Text({
          value: 'API 服务器配置',
          style: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#1d1d1f',
            marginBottom: '20px',
            display: 'block'
          }
        }),
        
        // API地址配置项
        View({
          style: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #d1d1d6'
          }
        }, [
          View({
            style: {
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px'
            }
          }, [
            Text({
              value: '🌐',
              style: {
                fontSize: '20px',
                marginRight: '12px'
              }
            }),
            View({
              style: {
                flex: '1'
              }
            }, [
              Text({
                value: 'API 地址',
                style: {
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  marginBottom: '4px',
                  display: 'block'
                }
              }),
              Text({
                value: '您的数据接收服务器地址',
                style: {
                  fontSize: '14px',
                  color: '#86868b',
                  display: 'block'
                }
              })
            ])
          ]),
          TextInput({
            value: this.state.apiUrl,
            placeholder: 'https://your-api-server.com/api/push',
            style: {
              fontSize: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #d1d1d6',
              backgroundColor: '#f9f9f9',
              width: '100%',
              fontFamily: 'SF Mono, Monaco, monospace',
              transition: 'all 0.2s ease',
              ':focus': {
                borderColor: '#007aff',
                backgroundColor: 'white',
                outline: 'none'
              }
            },
            onChange: (value) => {
              this.updateSetting(props, 'apiUrl', value)
            }
          })
        ]),
        
        // Token配置项
        View({
          style: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #d1d1d6'
          }
        }, [
          View({
            style: {
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px'
            }
          }, [
            Text({
              value: '🔑',
              style: {
                fontSize: '20px',
                marginRight: '12px'
              }
            }),
            View({
              style: {
                flex: '1'
              }
            }, [
              Text({
                value: 'API Token',
                style: {
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  marginBottom: '4px',
                  display: 'block'
                }
              }),
              Text({
                value: '用于身份验证的API认证令牌',
                style: {
                  fontSize: '14px',
                  color: '#86868b',
                  display: 'block'
                }
              })
            ])
          ]),
          TextInput({
            value: this.state.authToken,
            placeholder: '请输入您的API认证令牌',
            style: {
              fontSize: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #d1d1d6',
              backgroundColor: '#f9f9f9',
              width: '100%',
              fontFamily: 'SF Mono, Monaco, monospace',
              transition: 'all 0.2s ease',
              ':focus': {
                borderColor: '#007aff',
                backgroundColor: 'white',
                outline: 'none'
              }
            },
            onChange: (value) => {
              this.updateSetting(props, 'authToken', value)
            }
          })
        ])
      ]),
      
      // 操作按钮区域
      View({
        style: {
          textAlign: 'center',
          marginTop: '32px',
          marginBottom: '40px'
        }
      }, [
        Button({
          label: '重置为默认配置',
          style: {
            fontSize: '17px',
            fontWeight: '600',
            borderRadius: '12px',
            backgroundColor: '#ff3b30',
            color: 'white',
            padding: '14px 32px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(255, 59, 48, 0.3)',
            ':hover': {
              backgroundColor: '#d70015',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(255, 59, 48, 0.4)'
            }
          },
          onClick: () => {
            this.resetSettings(props)
          }
        })
      ]),
      
      // 底部说明
      View({
        style: {
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f2f2f7',
          borderRadius: '12px',
          marginTop: '24px'
        }
      }, [
        Text({
          value: '💡 使用提示',
          style: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1d1d1f',
            marginBottom: '8px',
            display: 'block'
          }
        }),
        Text({
          value: '• API地址必须以 https:// 开头\n• Token用于服务器身份验证，请妥善保管\n• 配置完成后，设备将自动同步心率和位置数据',
          style: {
            fontSize: '14px',
            color: '#86868b',
            lineHeight: '1.6',
            textAlign: 'left',
            display: 'block'
          }
        })
      ])
    ]
  },

  /**
   * 更新设置值
   */
  updateSetting(props, key, value) {
    try {
      // 更新内存中的状态
      this.state[key] = value
      
      // 保存到持久化存储
      props.settingsStorage.setItem(key, value.toString())
      
      // 保存完整设置对象到统一存储键
       const settings = {
         apiEndpoint: this.state.apiUrl,
         authToken: this.state.authToken
       }
       props.settingsStorage.setItem('appSettings', JSON.stringify(settings))
      
      console.log(`设置已更新: ${key} = ${value}`)
      
      // 通知设备应用设置已更改
      this.notifyDeviceApp(props)
      
    } catch (error) {
      console.error(`更新设置失败: ${key}`, error)
      this.showNotification('设置更新失败，请重试')
    }
  },

  /**
   * 通知设备应用设置已更改
   */
  notifyDeviceApp(props) {
    try {
      console.log('通知设备应用设置更改')
      
      // 构建设置对象
       const settings = {
         apiEndpoint: this.state.apiUrl,
         authToken: this.state.authToken
       }
      
      // 通过消息传递机制通知设备端重新加载设置
      if (props.messageBuilder) {
        props.messageBuilder.call({
          method: 'SETTINGS_CHANGED',
          data: settings
        })
        console.log('已通知设备应用更新设置:', settings)
      }
    } catch (error) {
      console.error('通知设备应用失败:', error)
    }
  },



  /**
   * 重置设置
   */
  resetSettings(props) {
    try {
      console.log('重置设置到默认值...')
      
      // 清除存储中的设置
      props.settingsStorage.removeItem('apiUrl')
      props.settingsStorage.removeItem('authToken')
      
      // 重置状态到默认值
      this.state = {
        apiUrl: 'https://your-api-server.com/api/push',
        authToken: 'your-api-token-here'
      }
      
      console.log('设置已重置为默认值')
      this.showNotification('🔄 设置已重置为默认值')
      
      // 通知设备应用重新加载设置
      this.notifyDeviceApp(props)
      
    } catch (error) {
      console.error('重置设置失败:', error)
      this.showNotification('❌ 重置设置失败')
    }
  },

  /**
   * 显示通知消息
   */
  showNotification(message) {
    console.log('通知:', message)
    // 在实际的Zepp OS 4.0设置应用中，这里应该使用适当的通知组件
  }
})