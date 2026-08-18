/**
 * Empty stub for platform dataloom / file storage module.
 * In standalone deployments, file uploads are not available through the platform.
 */
export async function getDataloom(): Promise<null> {
  return null;
}

export const createDataLoomClient = () => null;

export default { getDataloom, createDataLoomClient };
