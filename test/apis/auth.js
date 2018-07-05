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
				const { params, wxappAuth } = this;
				return wxappAuth.login(params.body);
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
				const { params, wxappAuth } = this;
				return wxappAuth.getUserInfo(params.body);
			},
		},
	},
	'/verify': {
		get: {
			summary: 'Verify session',
			security: ['wechatUser'],
			async ctrl() {
				const { wxappAuth } = this;
				const ok = await wxappAuth.verify();
				return { ok };
			},
		},
	},
};
