import { HikSettings } from './settings';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface Session {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

export interface SessionWithMessages extends Session {
	messages: ChatMessage[];
}

export async function streamChat(
	settings: HikSettings,
	sessionId: string,
	messages: ChatMessage[],
	onChunk: (chunk: string) => void,
	onDone: (usage: any) => void,
	onError: (error: string) => void,
) {
	try {
		const response = await fetch(`${settings.baseUrl}/api/v1/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': settings.apiKey,
			},
			body: JSON.stringify({
				sessionId,
				messages,
				model: settings.model,
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				errText || `HTTP error! status: ${response.status}`,
			);
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) throw new Error('No response body');

		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					try {
						const parsed = JSON.parse(data);
						if (parsed.type === 'text') {
							onChunk(parsed.content);
						} else if (parsed.type === 'done') {
							onDone(parsed.usage);
						}
					} catch (e) {
						// Ignore JSON parse errors for incomplete chunks
					}
				}
			}
		}
	} catch (error: any) {
		onError(error.message);
	}
}

export async function fetchSessions(settings: HikSettings): Promise<Session[]> {
	const response = await fetch(`${settings.baseUrl}/api/v1/sessions`, {
		headers: {
			'x-api-key': settings.apiKey,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch sessions: ${response.statusText}`);
	}

	const data = await response.json();
	return data.sessions;
}

export async function fetchSession(
	settings: HikSettings,
	sessionId: string,
): Promise<SessionWithMessages> {
	const response = await fetch(
		`${settings.baseUrl}/api/v1/sessions/${sessionId}`,
		{
			headers: {
				'x-api-key': settings.apiKey,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch session: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}
