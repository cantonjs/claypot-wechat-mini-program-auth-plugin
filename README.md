# claypot-wxapp-auth-plugin

[![Build Status](https://travis-ci.org/cantonjs/claypot-wxapp-auth-plugin.svg?branch=master)](https://travis-ci.org/cantonjs/claypot-wxapp-auth-plugin)

Wechat mini program auth plugin for [Claypot](https://github.com/cantonjs/claypot), built on top of [wxapp-auth](https://github.com/cantonjs/wxapp-auth).

## Installing

```bash
$ yarn add claypot claypot-restful-plugin claypot-wxapp-auth-plugin
```

## Usage and Example

**Claypotfile.js**

```js
module.exports = {
  plugins: [
    {
      module: 'claypot-restful-plugin',
      options: {},
    },
    {
      module: 'claypot-wxapp-auth-plugin',
      options: {
        appId: '<APPID>', // required
        appSecret: '<APP SECRET>', // required
        namespace: 'wxappAuth', // `ctx.clay.wxappAuth`
        prefix: 'wxappAuth', // cache key prefix
        ttl = 172800, // cache ttl (2 days by default)
        security: 'wxapp', // `claypot-restful-plugin` security
        signKey: 'id', // sign({ [signKey]: signValue })
      },
    },
  ],
};
```

**models/User.js**

```js
export default class Users {
	async login({ body }, ctx) {
		const { code } = body;
		const { wxappAuth } = ctx.clay;
		const { openid, sign } = await wxappAuth.login({ code });
		const { accessToken, expiresIn } = await sign({ id: openid });
		return { accessToken, expiresIn };
	}
	async getUserInfo({ body }, ctx) {
		const { wxappAuth } = ctx.clay;
		const userInfo = await wxappAuth.getUserInfo(body);
		return userInfo;
	}
	// ...
}
```

## License

MIT
