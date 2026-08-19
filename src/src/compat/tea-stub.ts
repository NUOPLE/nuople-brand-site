// Stub for platform tea/analytics module — no-op in standalone deployments
export const createTracker = async () => {};
export const reportTeaEvent = async () => {};
export const encryptTea = (s: string) => s;
