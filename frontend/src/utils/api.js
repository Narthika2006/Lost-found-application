import { getAuth } from "./auth";

const defaultBase =
  process.env.REACT_APP_API_URL ||
  localStorage.getItem("apiBase") ||
  "http://localhost:5000";

export function getApiBase() {
  return localStorage.getItem("apiBase") || defaultBase;
}

export function setApiBase(url) {
  localStorage.setItem("apiBase", url);
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    isForm = false,
    auth = false,
  } = options;

  const headers = {};

  if (auth) {
    const authData = getAuth();
    if (authData?.token) {
      headers.Authorization = `Bearer ${authData.token}`;
    }
  }

  let payload = body;

  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: payload,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}