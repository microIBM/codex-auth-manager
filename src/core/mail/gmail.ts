// @ts-nocheck
import {fetch as undiciFetch, Headers} from "undici";
import {appConfig} from "../config.js";
import {abortableDelay, throwIfAborted} from "../utils.js";
import {generateEmailName} from "./generate-email-name.js";
import {findLatestVerificationMail} from "./verification-matcher.js";

const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1";
const GMAIL_USER_ID = "me";
const GMAIL_DOMAINS = ["gmail.com", "googlemail.com"];
const GMAIL_POLL_ATTEMPTS = 12;
const GMAIL_POLL_INTERVAL_MS = 5000;
const GMAIL_MAX_RESULTS = 10;

function buildAuthHeaders() {
  if (!appConfig.gmailAccessToken) {
    throw new Error("Gmail access token 未配置，请先在配置页填写 gmailAccessToken");
  }
  return new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${appConfig.gmailAccessToken}`,
  });
}

async function gmailRequest(path, query = {}, options = {}) {
  const url = new URL(`${GMAIL_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  const response = await undiciFetch(url, {
    method: "GET",
    signal: options.abortSignal,
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Gmail 请求失败: ${response.status} body=${await response.text()}`);
  }

  return response.json();
}

async function gmailDeleteRequest(path, options = {}) {
  const response = await undiciFetch(`${GMAIL_API_BASE_URL}${path}`, {
    method: "DELETE",
    signal: options.abortSignal,
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Gmail 删除请求失败: ${response.status} body=${await response.text()}`);
  }
}

function decodeBase64Url(value) {
  if (!value) {
    return "";
  }
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function buildGmailAlias(email) {
  const [localPart] = String(email).split("@");
  if (!localPart) {
    throw new Error(`Gmail 邮箱格式不正确: ${email}`);
  }

  const domain = GMAIL_DOMAINS[Math.floor(Math.random() * GMAIL_DOMAINS.length)];
  return `${localPart}+${generateEmailName()}@${domain}`;
}

function collectBodyText(payload, chunks = []) {
  if (!payload) {
    return chunks;
  }

  if (payload.body?.data) {
    chunks.push(decodeBase64Url(payload.body.data));
  }

  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      collectBodyText(part, chunks);
    }
  }

  return chunks;
}

function getHeaderValue(payload, name) {
  const headers = Array.isArray(payload?.headers) ? payload.headers : [];
  const match = headers.find(
    (item) => String(item?.name ?? "").toLowerCase() === name.toLowerCase(),
  );
  return String(match?.value ?? "");
}

async function listMessagesByRecipient(targetEmail, options = {}) {
  const q = `to:${targetEmail}`;

  const payload = await gmailRequest(`/users/${encodeURIComponent(GMAIL_USER_ID)}/messages`, {
    q,
    maxResults: GMAIL_MAX_RESULTS,
  }, options);

  return Array.isArray(payload.messages) ? payload.messages : [];
}

async function getMessage(messageId, options = {}) {
  const payload = await gmailRequest(
    `/users/${encodeURIComponent(GMAIL_USER_ID)}/messages/${encodeURIComponent(messageId)}`,
    {
      format: "full",
    },
    options,
  );

  const bodyContent = collectBodyText(payload.payload).join("\n").trim();
  const toAddress = getHeaderValue(payload.payload, "To");
  const subject = getHeaderValue(payload.payload, "Subject");
  const from = getHeaderValue(payload.payload, "From");

  return {
    id: payload.id ?? messageId,
    threadId: payload.threadId ?? "",
    labelIds: Array.isArray(payload.labelIds) ? payload.labelIds : [],
    snippet: payload.snippet ?? "",
    internalDate: Number(payload.internalDate ?? 0),
    toAddress,
    subject,
    from,
    bodyContent,
    payload,
  };
}

async function getLatestVerificationMessage(targetEmail, options = {}) {
  const messages = await listMessagesByRecipient(targetEmail, options);
  const details = [];

  for (const item of messages) {
    throwIfAborted(options.abortSignal);
    const message = await getMessage(item.id, options);
    details.push({
      ...message,
      recipient: message.toAddress,
      content: message.bodyContent,
      timestamp: message.internalDate,
      extraTexts: [message.snippet],
    });
  }

  return findLatestVerificationMail(details, {
    targetEmail,
    minTimestamp: options.minTimestamp,
  });
}

async function getLatestMessageSummary(targetEmail) {
  const messages = await listMessagesByRecipient(targetEmail);
  if (!messages.length) {
    return null;
  }
  const details = [];
  for (const item of messages) {
    const message = await getMessage(item.id);
    details.push(message);
  }
  details.sort((a, b) => Number(b.internalDate ?? 0) - Number(a.internalDate ?? 0));
  const latest = details[0];
  if (!latest) {
    return null;
  }
  const matched = findLatestVerificationMail([{
    ...latest,
    recipient: latest.toAddress,
    content: latest.bodyContent,
    timestamp: latest.internalDate,
    extraTexts: [latest.snippet],
  }], {targetEmail, rememberLastCode: false});
  return {
    id: String(latest.id ?? ""),
    sender: latest.from,
    recipient: latest.toAddress,
    subject: latest.subject,
    content: latest.bodyContent,
    snippet: latest.snippet,
    timestamp: latest.internalDate,
    receivedAt: latest.internalDate ? new Date(Number(latest.internalDate)).toISOString() : "",
    verificationCode: matched?.verificationCode ?? "",
  };
}

async function deleteMessage(messageId, options = {}) {
  await gmailDeleteRequest(
    `/users/${encodeURIComponent(GMAIL_USER_ID)}/messages/${encodeURIComponent(messageId)}`,
    options,
  );
}

export function createGmailProvider() {
  return {
    async getEmailAddress() {
      if (!appConfig.gmailEmailAddress) {
        throw new Error("Gmail 邮箱地址未配置，请先在配置页填写 gmailEmailAddress");
      }
      return buildGmailAlias(appConfig.gmailEmailAddress);
    },
    async getEmailVerificationCode(email, options = {}) {
      for (let attempt = 1; attempt <= GMAIL_POLL_ATTEMPTS; attempt += 1) {
        throwIfAborted(options.abortSignal);
        console.log(
          `pollGmailOtp: attempt=${attempt}/${GMAIL_POLL_ATTEMPTS} targetEmail=${email}`,
        );

        const message = await getLatestVerificationMessage(email, options);
        throwIfAborted(options.abortSignal);
        if (message?.verificationCode) {
          await deleteMessage(message.id, options);
          console.log(`gmailOtpCode: ${message.verificationCode}`);
          return message.verificationCode;
        }

        if (attempt < GMAIL_POLL_ATTEMPTS) {
          await abortableDelay(GMAIL_POLL_INTERVAL_MS, options.abortSignal);
        }
      }

      throw new Error(`Gmail 中未找到验证码: targetEmail=${email}`);
    },
    async getLatestEmail(email) {
      return getLatestMessageSummary(email);
    },
  };
}
