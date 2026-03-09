// 第二层映射：path -> url
const sessionPathMap = new Map<string, string>();

export function clearSessionPathMap() {
  sessionPathMap.clear();
}

export function getSessionPathMap() {
  return new Map(sessionPathMap);
}

export function setSessionPathUrl(path: string, url: string) {
  sessionPathMap.set(path, url);
}

