require('dotenv').config();

const { Client: DiscordClient, Intents } = require('discord.js');
const { WebSocketServer } = require('ws');

const { DISCORD_BOT_TOKEN, GUILD_ID, CATEGORY_ID } = process.env;

const wss = new WebSocketServer({ port: 5000 });

const client = new DiscordClient({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const clients = new Map();

const getChannelOrCreate = async (guildId, categoryId, userId) => {
	const guild = client.guilds.cache.get(guildId);

	if (!guild) return; //TODO: FAIL

	const category = guild.channels.cache.find(
		(channel) =>
			channel.type === 'GUILD_CATEGORY' && channel.id === categoryId
	);

	if (!category) return; //TODO: FAIL

	let channel = category.children.find(
		(channel) => channel.type === 'GUILD_TEXT' && channel.name === userId
	);

	return (
		channel ??
		(await guild.channels.create(userId, {
			type: 'text',
			parent: CATEGORY_ID,
		}))
	);
};

wss.on('connection', (ws) => {
	console.log('😃 Client Connected');

	ws.on('message', async (data) => {
		const { event, userId, payload } = JSON.parse(data);

		if (!client.isReady) {
			ws.close();
			return;
		}

		switch (event) {
			case 'CONNECT': {
				clients.set(userId, ws);
				const channel = await getChannelOrCreate(
					GUILD_ID,
					CATEGORY_ID,
					userId
				);

				const messageHistory = [
					...(await channel.messages.fetch({
						limit: 100,
					})),
				].map(([, message]) => {
					//TODO: check if clerk if message was sent from webapp
					const { author, content, createdTimestamp } = message;
					const isClerk = author.id !== client.user.id;

					return {
						user: isClerk
							? {
									isClerk: true,
									name: author.username,
									id: author.id,
							  }
							: {
									isClerk: false,
									name: 'You',
									id: userId,
							  },
						message: { date: createdTimestamp, content },
					};
				});

				ws.send(
					JSON.stringify({
						event: 'MESSAGE_HISTORY',
						payload: messageHistory,
					})
				);

				break;
			}
			case 'MESSAGE_CREATE': {
				clients.set(userId, ws);
				const channel = await getChannelOrCreate(
					GUILD_ID,
					CATEGORY_ID,
					userId
				);
				await channel.send(payload.message);
				break;
			}
			case 'DISCONNECT':
				clients.delete(userId);
				break;
			default:
				break;
		}
	});

	ws.on('close', () => {
		console.log('😞 Client Disconnected');
	});
});

client.on(
	'messageCreate',
	async ({ author, content, channel, createdTimestamp }) => {
		if (author.bot) return;

		if (channel.type !== 'GUILD_TEXT') return;
		if (channel.guildId !== GUILD_ID) return;
		if (channel.parentId !== CATEGORY_ID) return;

		const userId = channel.name;

		if (content === '!delete') {
			await channel.delete();
			return;
		}

		//TODO sanitize content
		const wsClient = clients.get(userId);

		if (!wsClient) return;

		wsClient.send(
			JSON.stringify({
				event: 'MESSAGE_CREATE',
				payload: {
					user: {
						isClerk: true,
						name: author.username,
						id: author.id,
					},
					message: {
						date: createdTimestamp,
						content,
					},
				},
			})
		);
	}
);

client.on('ready', () => console.log(`🤖 Logged in as ${client.user.tag}`));

client.login(DISCORD_BOT_TOKEN);
