export function log(message: string, ...args: any[]): void {
  console.log(`[${new Date().toISOString()}]`, message, ...args);
}

export function error(message: string, ...args: any[]): void {
  console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
}

export function warn(message: string, ...args: any[]): void {
  console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
}

export function info(message: string, ...args: any[]): void {
  console.info(`[${new Date().toISOString()}] INFO:`, message, ...args);
}
