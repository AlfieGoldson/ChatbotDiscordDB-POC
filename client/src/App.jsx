import React, { useEffect, useState, useRef } from 'react';
import { useChatbot } from './hooks/useChatbot';

export const App = () => {
	const { messages, sendMessage } = useChatbot('user-id');

	const [inputValue, setInputValue] = useState('');
	const chatboxRef = useRef(null);

	const handleSubmit = () => {
		sendMessage(inputValue);
		setInputValue('');
	};

	useEffect(() => {
		if (!chatboxRef.current) return;

		chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
	}, [messages]);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			<h1>Chatbot</h1>

			<div
				style={{
					width: '100%',
					maxWidth: '500px',
					backgroundColor: '#323645',
					borderRadius: '2rem',
					overflow: 'hidden',
				}}
			>
				<div
					ref={chatboxRef}
					style={{
						maxHeight: '500px',
						overflowY: 'scroll',
						padding: '1rem',
					}}
				>
					{messages
						.sort(
							(msgA, msgB) =>
								msgA.message.date - msgB.message.date
						)
						.map(({ user, message }, i) => {
							const isNextMessageFromSameUser =
								messages[i + 1]?.user.id !== user.id;

							return (
								<div
									key={i}
									style={{
										maxWidth: '100%',
										display: 'flex',
										flexDirection: 'column',
										alignItems: user.isClerk
											? 'flex-start'
											: 'flex-end',
										marginBottom: '0.25rem',
									}}
								>
									<div
										style={{
											maxWidth: '80%',
											borderRadius: '1.25rem',
											padding: '1.25rem',
											backgroundColor: user.isClerk
												? '#424657'
												: '#1D90F4',
											borderBottomLeftRadius: user.isClerk
												? '0.25rem'
												: '1.25rem',
											borderBottomRightRadius:
												user.isClerk
													? '1.25rem'
													: '0.25rem',
											boxShadow:
												'0 2px 0.5rem rgba(0, 0, 0, 0.1)',
										}}
									>
										{message.content}
									</div>
									{isNextMessageFromSameUser && (
										<p
											style={{
												display: 'flex',
												alignItems: 'center',
												flexDirection: user.isClerk
													? 'row'
													: 'row-reverse',
												margin: '0',
												marginTop: '0.25rem',
												marginBottom: '0.25rem',
											}}
										>
											<span
												style={{
													fontSize: '1rem',
												}}
											>
												{user.name}
											</span>{' '}
											<span
												style={{
													color: 'gray',
													fontSize: '0.75rem',
													textTransform: 'uppercase',
												}}
											>
												{message.date}
											</span>
										</p>
									)}
								</div>
							);
						})}
				</div>
				<div
					style={{
						padding: '1rem',
						display: 'flex',
					}}
				>
					<input
						type='text'
						value={inputValue}
						onChange={({ target }) => setInputValue(target.value)}
						style={{
							flex: 1,
							marginRight: '1rem',
							borderRadius: '0.75rem',
							border: 'none',
							padding: '1rem',
						}}
					/>
					<button
						onClick={handleSubmit}
						disabled={inputValue.length <= 0}
						style={{
							backgroundColor: '#1D90F4',
							padding: '1rem 2rem',
							border: 'none',
							borderRadius: '0.75rem',
							color: 'white',
							fontSize: '1rem',
							cursor: 'pointer',
						}}
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
};
