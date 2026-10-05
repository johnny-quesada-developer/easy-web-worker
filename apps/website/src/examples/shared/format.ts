export const milliseconds = (value: number) => `${Math.round(value).toLocaleString('en-US')} ms`;

export const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toLocaleString('en-US')} MB`;

export const count = (value: number) => value.toLocaleString('en-US');
