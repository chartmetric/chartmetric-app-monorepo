export interface HelloResponse {
  message: string;
}

export const helloMessage = (): HelloResponse => ({
  message: "Hello, world!",
});
