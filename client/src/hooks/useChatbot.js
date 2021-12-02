import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

const CHATBOT_ENDPOINT = 'ws://localhost:5000';

export const useChatbot = (userId) => {
	const [messages, setMessages] = useState([]);
	const { sendJsonMessage } = useWebSocket(
		CHATBOT_ENDPOINT,
		{
			onOpen: () => {
				console.log('🗒️ Connected to chatbot');
				sendJsonMessage({
					event: 'CONNECT',
					userId,
				});
			},
			onClose: () => {
				console.log('❄️ Disconnected from chatbot');
				sendJsonMessage({
					event: 'DISCONNECT',
					userId,
				});
			},
			shouldReconnect: () => true,
			onMessage: (message) => {
				const { event, payload } = JSON.parse(message.data);

				switch (event) {
					case 'MESSAGE_CREATE':
						addMessage(payload);
						break;
					case 'MESSAGE_HISTORY':
						setMessages(payload);
					default:
						break;
				}
			},
		},
		!!userId
	);

	const addMessage = (message) => {
		setMessages([...messages, message]);
	};

	const sendMessage = (message) => {
		if (message.length <= 0) return;

		sendJsonMessage({
			event: 'MESSAGE_CREATE',
			userId,
			payload: { message },
		});
		addMessage({
			user: {
				isClerk: false,
				name: 'You',
				id: userId,
			},
			message: {
				date: Date.now(),
				content: message,
			},
		});
	};

	return { messages, sendMessage };
};
