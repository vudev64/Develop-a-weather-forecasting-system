import { OAuth2Client } from 'google-auth-library';

const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const SAFE_GOOGLE_ERROR_CODES = new Set([
  'access_denied',
  'authError',
  'invalid_client',
  'invalid_grant',
  'invalid_scope',
  'unauthorized_client',
]);

const encodeBase64Url = (value) => Buffer.from(value).toString('base64url');

const getSafeGoogleErrorCode = (error) => {
  const code = error?.response?.data?.error
    || error?.response?.data?.error_description
    || error?.code;
  return typeof code === 'string' && SAFE_GOOGLE_ERROR_CODES.has(code)
    ? code
    : undefined;
};

export const sendPasswordResetOtp = async ({ email, otp, expiresInMinutes }) => {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;

  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    const error = new Error('Gmail API is not configured');
    error.code = 'GMAIL_CONFIG_MISSING';
    throw error;
  }

  if (!EMAIL_REGEX.test(senderEmail) || !EMAIL_REGEX.test(email) || !/^\d{6}$/.test(otp)) {
    const error = new Error('Invalid email or OTP parameters');
    error.code = 'GMAIL_INVALID_PARAMETERS';
    throw error;
  }

  const oauthClient = new OAuth2Client(clientId, clientSecret);
  oauthClient.setCredentials({ refresh_token: refreshToken });

  let token;
  try {
    ({ token } = await oauthClient.getAccessToken());
  } catch (cause) {
    const error = new Error('Unable to get Gmail API access token');
    error.code = 'GMAIL_OAUTH_TOKEN_FAILED';
    error.reason = getSafeGoogleErrorCode(cause);
    throw error;
  }

  if (!token) {
    const error = new Error('Unable to get Gmail API access token');
    error.code = 'GMAIL_ACCESS_TOKEN_UNAVAILABLE';
    throw error;
  }

  const message = [
    `From: ${senderEmail}`,
    `To: ${email}`,
    'Subject: WeatherWeb password reset code',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    `Your WeatherWeb password reset code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
  ].join('\r\n');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodeBase64Url(message) }),
    }
  );

  if (!response.ok) {
    let reason;
    try {
      const responseBody = await response.json();
      reason = responseBody?.error?.errors?.[0]?.reason
        || responseBody?.error?.status
        || responseBody?.error?.errors?.[0]?.message;
    } catch {
      reason = undefined;
    }

    const safeReason = typeof reason === 'string'
      && /^[a-zA-Z0-9_-]{1,64}$/.test(reason)
      ? reason
      : undefined;
    const error = new Error(`Gmail API request failed with status ${response.status}`);
    error.code = `GMAIL_API_${response.status}`;
    error.status = response.status;
    error.stage = 'gmail_api';
    error.reason = safeReason;
    throw error;
  }

  return true;
};
