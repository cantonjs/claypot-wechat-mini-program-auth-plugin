import { user } from '../fixtures';

export default {
	'/login': {
		post: {
			summary: 'Login',
			security: [],
			params: {
				body: {
					schema: {
						type: 'object',
						properties: {
							code: { type: 'string' },
						},
						required: ['code'],
					},
				},
			},
			async ctrl() {
				const { params, wxAuth } = this;
				const { sign, openid } = await wxAuth.login(params.body);
				const signRes = await sign({ id: user.id });
				return { ...signRes, user, openid };
			},
		},
	},
	'/getUserInfo': {
		post: {
			summary: 'Get user info',
			security: ['wechatUser'],
			params: {
				body: {
					schema: {
						type: 'object',
						properties: {
							rawData: { type: 'string' },
							signature: { type: 'string' },
						},
						required: ['rawData', 'signature'],
					},
				},
			},
			async ctrl() {
				const { params, wxAuth } = this;
				return wxAuth.getUserInfo(params.body);
			},
		},
	},
	'/verify': {
		get: {
			summary: 'Verify session',
			security: ['wechatUser'],
			async ctrl() {
				const { wxAuth } = this;
				const ok = await wxAuth.verify();
				return { ok };
			},
		},
	},
};
