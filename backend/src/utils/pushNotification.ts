interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
}

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!deviceToken) return;

  const message: ExpoPushMessage = {
    to: deviceToken,
    title,
    body,
    data,
    sound: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('[Push] Expo API error:', response.status, await response.text());
    }
  } catch (err) {
    console.error('[Push] Failed to send notification:', (err as Error).message);
  }
}
