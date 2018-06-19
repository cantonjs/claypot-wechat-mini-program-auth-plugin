import { ensureLogger } from 'claypot';
import WechatMiniProgramAuth from 'wechat-mini-program-auth';

const logger = ensureLogger('wechat-mini-program-auth', 'yellowBright');

const warnMemoryCache = function warnMemoryCache(cache) {
	if (!warnMemoryCache.warned && cache.store && cache.store.name === 'memory') {
		warnMemoryCache.warned = true;
		logger.warn(
			'It is recommended to use `redis` cache store instead of `memory` in `store` config.',
		);
	}
};

export default class WechatMiniProgramAuthClaypotPlugin {
	constructor(config = {}) {
		const {
			appId,
			appSecret,
			store,
			prefix = 'wmpa',
			security = 'wechatUser',
			ttl = '2d',
			wechatLoginURL, // only for testing,
		} = config;
		this._appId = appId;
		this._appSecret = appSecret;
		this._wechatLoginURL = wechatLoginURL;
		this._storeKey = store;
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
		const { _ttl: ttl, _appId, _appSecret, _wechatLoginURL } = this;
		const getKey = (id) => `${this._prefix}:${id}`;
		const options = {};
		if (_wechatLoginURL) options.wechatLoginURL = _wechatLoginURL;
		const wechatMiniProgramAuth = new WechatMiniProgramAuth(
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

			ctx.clay.wechatMiniProgramAuth = {
				login: async ({ code }) => {
					const { sign } = ctx.clay;

					if (!sign) {
						logger.fatal('required `claypot-restful-plugin`');
						ctx.throw(500);
						return;
					}

					const {
						sessionKey,
						openid,
						unionid,
					} = await wechatMiniProgramAuth.getSession({ code });
					const signPayload = { openid, unionid };
					const signOptions = { security: this._security };
					const res = await sign(signPayload, signOptions);
					const cacheKey = getKey(openid);
					await this._cacheStore.set(cacheKey, sessionKey, { ttl });
					return { ...res, openid, unionid };
				},
				getUserInfo: async (params = {}) => {
					const sessionKey = await getSession();
					if (!sessionKey) return ctx.throw(401, 'Session Expired');
					return wechatMiniProgramAuth.getUserInfo({ ...params, sessionKey });
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
