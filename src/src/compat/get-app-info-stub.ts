export function useAppInfo() {
  return { appInfo: null, loading: false };
}

export function getAppInfo() {
  return Promise.resolve(null);
}

export default { useAppInfo, getAppInfo };
