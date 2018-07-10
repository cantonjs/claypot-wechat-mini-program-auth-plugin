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
							useCustomSignPayload: { type: 'boolean' },
						},
						required: ['code'],
					},
				},
			},
			async ctrl() {
				const { params, wxappAuth } = this;
				const { code, useCustomSignPayload } = params.body;
				const options = { code };
				if (useCustomSignPayload) {
					const getSignPayload = () => {
						return {
							payload: { id: '1' },
							extraData: { user: { id: 1, name: 'jack' } },
						};
					};
					Object.assign(options, { getSignPayload });
				}
				return wxappAuth.login(options);
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
