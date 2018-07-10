import { ensureLogger } from 'claypot';
import Wxapp from 'wxapp-auth';

const logger = ensureLogger('wxapp-auth', 'yellowBright');

const warnMemoryCache = function warnMemoryCache(cache) {
	if (!warnMemoryCache.warned && cache.store && cache.store.name === 'memory') {
		warnMemoryCache.warned = true;
		logger.warn(
			'It is recommended to use `redis` cache store instead of `memory` in `store` config.',
		);
	}
};

export default class WxappClaypotPlugin {
	constructor(config = {}) {
		const {
			appId,
			appSecret,
			store,
			//TODO: 增加namespace的使用 --done but need to check and add test case
			namespace = 'wxappAuth',
			prefix = 'wxappAuth',
			security = 'wxapp',
			ttl = '2d',
			wechatLoginURL, // only for testing,
		} = config;
		this._appId = appId;
		this._appSecret = appSecret;
		this._wechatLoginURL = wechatLoginURL;
		this._storeKey = store;
		this._namespace = namespace;
		this._prefix = prefix;
		this._ttl = ttl;
		this._security = security;
	}

	async willStartServer(app) {
		const { cacheStores, cache } = app;
		const { _storeKey } = this;
		const cacheStore = _storeKey ? cacheStores[_storeKey] : cache;
		warnMemoryCache(cacheStore);
		this._cacheStore = cacheStore;
	}

	middleware(app) {
		const { _ttl: ttl, _appId, _appSecret, _wechatLoginURL, _namespace } = this;
		const getKey = (id) => `${this._prefix}:${id}`;
		const options = {};
		if (_wechatLoginURL) options.wechatLoginURL = _wechatLoginURL;
		const wxappAuth = new Wxapp(
			_appId,
			_appSecret,
			options,
		);

		app.use(async (ctx, next) => {
			const getSession = async () => {
				const wechatUserIdData = ctx.clay.states[this._security];
				if (!wechatUserIdData || !wechatUserIdData.openid) return false;
				const { openid } = wechatUserIdData;
				const cacheKey = getKey(openid);
				return this._cacheStore.get(cacheKey);
			};

			const pluginSign = async (signPayload = {}, isReSign) => {
				const { sign } = ctx.clay;

				if (!sign) {
					logger.fatal('required `claypot-restful-plugin`');
					ctx.throw(500);
					return;
				}

				const signOptions = { security: this._security };

				const res = await sign(signPayload, signOptions);
				return res;
			};

			ctx.clay[_namespace] = {
				login: async ({ code, getSignPayload }) => {

					const {
						sessionKey,
						openid,
						unionid,
					} = await wxappAuth.getSession({ code });

					// use openid to set cache
					const cacheKey = getKey(openid);
					await this._cacheStore.set(cacheKey, sessionKey, { ttl });

					const signPayload = { openid };
					const res = { openid, unionid };

					if (typeof getSignPayload === 'function') {
						const { payload, extraData } = getSignPayload();
						Object.assign(signPayload, payload);
						Object.assign(res, extraData);
					}

					const signRes = await pluginSign(signPayload);

					return { ...res, ...signRes };
				},
				getUserInfo: async (params = {}) => {
					const sessionKey = await getSession();
					if (!sessionKey) return ctx.throw(401, 'Session Expired');

					// TODO 捕捉解密失败的错误 并抛出401错误 --done but need to check and add test case
					try {
						const res = await wxappAuth.getUserInfo({ ...params, sessionKey });
						return res;
					}
					catch (err) {
						return ctx.throw(401, err);
					}
				},
				verify: async () => {
					const sessionKey = await getSession();
					if (!sessionKey) ctx.throw(401, 'Session Expired');
					return true;
				},
			};

			await next();
		});
	}
}
