import { startServer, stopServer } from './utils';
import { sha1 } from 'wechat-mini-program-auth/lib/utils';
import fetch from 'node-fetch';
import { sessionKey } from './fixtures';
import delay from 'delay';

describe('claypot restful plugin', () => {
	afterEach(stopServer);

	test('should login() work', async () => {
		const { urlRoot } = await startServer();
		const res = await fetch(`${urlRoot}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify({ code: 'foo' }),
			headers: { 'Content-Type': 'application/json' },
		});
		expect(await res.json()).toMatchObject({
			accessToken: expect.any(String),
			openid: expect.any(String),
		});
	});

	test('should getUserInfo() work', async () => {
		const { urlRoot } = await startServer();
		const json = { hello: 'world' };
		const rawData = JSON.stringify(json);
		const loginRes = await fetch(`${urlRoot}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify({ code: 'foo' }),
			headers: { 'Content-Type': 'application/json' },
		});
		const { accessToken } = await loginRes.json();
		const res = await fetch(`${urlRoot}/api/auth/getUserInfo`, {
			method: 'POST',
			body: JSON.stringify({
				rawData,
				signature: sha1(rawData + sessionKey),
			}),
			headers: {
				'Content-Type': 'application/json',
				'X-ACCESS-TOKEN': accessToken,
			},
		});
		expect(await res.json()).toEqual(json);
	});

	test('should verify() work', async () => {
		const { urlRoot } = await startServer({ ttl: 1 });
		const loginRes = await fetch(`${urlRoot}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify({ code: 'foo' }),
			headers: { 'Content-Type': 'application/json' },
		});
		const { accessToken } = await loginRes.json();
		await delay(1000);
		const res = await fetch(`${urlRoot}/api/auth/verify`, {
			headers: { 'X-ACCESS-TOKEN': accessToken },
		});
		expect(await res.json()).toMatchObject({ message: 'Session Expired' });
	});
});
