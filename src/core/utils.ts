export function log(...args) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}