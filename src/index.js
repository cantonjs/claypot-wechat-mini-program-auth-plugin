import { createLogger, cacheStores, cache } from 'claypot';
import koaWechatAuthMiddleware from 'koa-wechat-mini-program-auth';

const logger = createLogger('api', 'yellowBright');

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
		const { appId, appSecret, store, prefix, ttl = '2d' } = config;
		this._config = { appId, appSecret };
		this._storeKey = store;
		this._prefix = prefix;
		this._ttl = ttl;
	}

	async willStartServer() {
		const { _storeKey } = this;
		const cacheStore = _storeKey ? cacheStores[_storeKey] : cache;
		warnMemoryCache(cacheStore);
		this._cacheStore = cacheStore;
	}

	middleware(app) {
		const ttl = this._ttl;
		const getKey = (id) => `${this._prefix}:${id}`;
		const authStateInjection = koaWechatAuthMiddleware({
			...this._config,
			async sign({ id }) {},
			async getSessionKey({ openid }) {
				const key = getKey(openid);
				return this._cacheStore.get(key);
			},
			async setSessionKey({ openid, sessionKey }) {
				const key = getKey(openid);
				return this._cacheStore.set(key, sessionKey, { ttl });
			},
		});
		app.use(authStateInjection);
	}
}
