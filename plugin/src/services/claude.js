import { SYSTEM_PROMPT, APPLY_EDITS_TOOL } from '../prompts/system';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const STORAGE_KEY = 'rawbuddy_api_key';

// UXP supports localStorage — it is scoped per plugin and persists across sessions.
export async function getApiKey() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export async function saveApiKey(key) {
  window.localStorage.setItem(STORAGE_KEY, key.trim());
}

export async function removeApiKey() {
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Send a natural language editing command to Claude.
 * Returns the parsed tool_use input: { explanation, camera_raw?, photoshop? }
 *
 * @param {string} userCommand
 * @param {object|null} documentContext
 */
export async function sendEditCommand(userCommand, documentContext) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please add your Anthropic API key in Settings.');
  }

  const contextLine = documentContext
    ? `Active document: "${documentContext.name}", ${documentContext.width}×${documentContext.height}px, ${documentContext.colorMode} mode.`
    : 'No document context available.';

  const response = await fetch(API_URL, {
    method: 'POST',
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
          content: `${contextLine}\n\nEditing instruction: ${userCommand}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API error ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      // use raw text
    }
    throw new Error(message);
  }

  const data = await response.json();

  const toolUseBlock = data.content?.find((block) => block.type === 'tool_use');
  if (!toolUseBlock) {
    throw new Error('Claude did not return edit instructions. Please try rephrasing your command.');
  }

  return toolUseBlock.input;
}
