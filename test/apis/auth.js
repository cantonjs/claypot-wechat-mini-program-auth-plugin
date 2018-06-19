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
				const { params, wechatMiniProgramAuth } = this;
				return wechatMiniProgramAuth.login(params.body);
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
				const { params, wechatMiniProgramAuth } = this;
				return wechatMiniProgramAuth.getUserInfo(params.body);
			},
		},
	},
	'/verify': {
		get: {
			summary: 'Verify session',
			security: ['wechatUser'],
			async ctrl() {
				const { wechatMiniProgramAuth } = this;
				const ok = await wechatMiniProgramAuth.verify();
				return { ok };
			},
		},
	},
};
