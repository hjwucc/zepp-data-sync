/**
 * Device Polyfill for Zepp OS
 * 提供设备端环境中缺少的方法和对象
 */

// 如果环境中没有Buffer，提供一个简单的polyfill
if (typeof Buffer === 'undefined') {
  global.Buffer = {
    from: function(data, encoding) {
      if (typeof data === 'string') {
        const bytes = [];
        for (let i = 0; i < data.length; i++) {
          bytes.push(data.charCodeAt(i));
        }
        return new Uint8Array(bytes);
      }
      return new Uint8Array(data);
    },
    
    alloc: function(size, fill) {
      const buffer = new Uint8Array(size);
      if (fill !== undefined) {
        buffer.fill(fill);
      }
      return buffer;
    }
  };
}

// 如果环境中没有TextEncoder/TextDecoder，提供polyfill
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(str) {
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 0x80) {
          bytes.push(code);
        } else if (code < 0x800) {
          bytes.push(0xc0 | (code >> 6));
          bytes.push(0x80 | (code & 0x3f));
        } else {
          bytes.push(0xe0 | (code >> 12));
          bytes.push(0x80 | ((code >> 6) & 0x3f));
          bytes.push(0x80 | (code & 0x3f));
        }
      }
      return new Uint8Array(bytes);
    }
  };
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class {
    decode(bytes) {
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      return str;
    }
  };
}

// 确保console对象存在
if (typeof console === 'undefined') {
  global.console = {
    log: function() {},
    error: function() {},
    warn: function() {},
    info: function() {}
  };
}

console.log('Device polyfill loaded');