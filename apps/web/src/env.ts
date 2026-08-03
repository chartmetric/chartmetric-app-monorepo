const requireEnvironmentVariable = (
  name: string,
  value: string | undefined,
): string => {
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};

export const env = {
  apiUrl: requireEnvironmentVariable(
    "VITE_API_URL",
    import.meta.env.VITE_API_URL,
  ),
  propelauthAuthUrl: requireEnvironmentVariable(
    "VITE_PROPELAUTH_AUTH_URL",
    import.meta.env.VITE_PROPELAUTH_AUTH_URL,
  ),
} as const;
