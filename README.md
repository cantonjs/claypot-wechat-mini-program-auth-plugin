# claypot-wxapp-auth-plugin

[![Build Status](https://travis-ci.org/cantonjs/claypot-wxapp-auth-plugin.svg?branch=master)](https://travis-ci.org/cantonjs/claypot-wxapp-auth-plugin)

## Installing

```bash
$ yarn add claypot claypot-wxapp-auth-plugin
```

## Usage

**Claypotfile.js**

```js
module.exports = {
    module: 'claypot-wxapp-auth-plugin',
    options: {
          appId: <APPID>,
          appSecret: <APP SECRET>,
          namespace: 'wxappAuth',
          prefix: 'wxappAuth',
          security: 'wxapp',
          ttl = 172800, // 2days
          signKey: 'id',
    },
};
```

## License

MIT
