import { SYSTEM_PROMPT, APPLY_EDITS_TOOL, CRITIQUE_SYSTEM_PROMPT, CRITIQUE_TOOL } from '../prompts/system';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const STORAGE_KEY = 'rawbuddy_api_key';

export function getApiKey() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? raw.trim() || null : null;
  } catch {
    return null;
  }
}

export function saveApiKey(key) {
  window.localStorage.setItem(STORAGE_KEY, key.trim());
}

export function removeApiKey() {
  window.localStorage.removeItem(STORAGE_KEY);
}

async function parseApiError(response) {
  const errorBody = await response.text();
  let message = `API error ${response.status}`;
  try {
    const parsed = JSON.parse(errorBody);
    if (parsed.error?.message) message = parsed.error.message;
  } catch { /* use raw text */ }
  return new Error(message);
}

export async function sendEditCommand(userCommand, documentContext, imageBase64 = null) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please add your Anthropic API key in Settings.');
  }

  const contextLine = documentContext
    ? `Active document: "${documentContext.name}", ${documentContext.width}×${documentContext.height}px, ${documentContext.colorMode} mode.`
    : 'No document context available.';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: [APPLY_EDITS_TOOL],
        tool_choice: { type: 'tool', name: 'apply_photo_edits' },
        messages: [
          {
            role: 'user',
            content: imageBase64
              ? [
                  {
                    type: 'image',
                    source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
                  },
                  { type: 'text', text: `${contextLine}\n\nEditing instruction: ${userCommand}` },
                ]
              : `${contextLine}\n\nEditing instruction: ${userCommand}`,
          },
        ],
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw await parseApiError(response);

  const data = await response.json();

  const toolUseBlock = data.content?.find((block) => block.type === 'tool_use');
  if (!toolUseBlock) {
    throw new Error('Claude did not return edit instructions. Please try rephrasing your command.');
  }

  return toolUseBlock.input;
}

export async function sendCritiqueRequest(documentContext, imageBase64) {
  if (!imageBase64) {
    throw new Error(
      'Critique requires a visible document. Open a photo in Photoshop first.'
    );
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please add your Anthropic API key in Settings.');
  }

  const contextLine = documentContext
    ? `Document: "${documentContext.name}", ${documentContext.width}×${documentContext.height}px, ${documentContext.colorMode} mode.`
    : 'No document context available.';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: CRITIQUE_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: [CRITIQUE_TOOL],
        tool_choice: { type: 'tool', name: 'critique_photo' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              { type: 'text', text: `${contextLine}\n\nPlease critique this photo against PSA competition standards.` },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw await parseApiError(response);

  const data = await response.json();

  const toolUseBlock = data.content?.find((block) => block.type === 'tool_use');
  if (!toolUseBlock) {
    throw new Error('Claude did not return a critique. Please try again.');
  }

  return toolUseBlock.input;
}
