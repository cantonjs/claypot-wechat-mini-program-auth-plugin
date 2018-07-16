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
			namespace = 'wxappAuth',
			prefix = 'wxappAuth',
			security = 'wxapp',
			ttl = 172800, // 2days
			signKey = 'id',
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
		this._signKey = signKey;
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
			const { _signKey } = this;
			const getSession = async () => {
				const wechatUserIdData = ctx.clay.states[this._security];
				if (!wechatUserIdData || !wechatUserIdData[_signKey]) return false;
				const id = wechatUserIdData[_signKey];
				const cacheKey = getKey(id);
				return this._cacheStore.get(cacheKey);
			};

			const pluginSign = async (signPayload = {}) => {
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
				login: async ({ code }) => {

					const {
						sessionKey,
						openid,
						unionid,
					} = await wxappAuth.getSession({ code });

					const sign = async (payload) => {
						let signValue;

						if (!payload) {
							signValue = openid;
						}
						else {
							signValue = payload[_signKey];
							if (!signValue) {
								ctx.throw(500, `Sign Error: sign content should contain ${_signKey}`);
							}
						}

						const cacheKey = getKey(signValue);
						await this._cacheStore.set(cacheKey, sessionKey, { ttl });

						return pluginSign(payload);
					};

					return { sign, openid, unionid };
				},
				getUserInfo: async (params = {}) => {
					const sessionKey = await getSession();
					if (!sessionKey) return ctx.throw(401, 'Session Expired');
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
