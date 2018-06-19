import { sessionKey } from '../fixtures';

export default class FakeWechatServer {
	middleware(app) {
		app.use(async (ctx, next) => {
			if (ctx.request.path === '/wechat') {
				ctx.body = {
					session_key: sessionKey,
					openid: 'fake_open_id',
				};
				return;
			}
			await next();
		});
	}
}
