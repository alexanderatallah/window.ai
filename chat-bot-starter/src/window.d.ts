// define a api for window
// has a objct named 'ai
// ai has a function called getCompletion that returns a promise and a string

declare interface Window {
  // ai: {
  //     getCompletion: (text: string) => Promise<string>;
  // };

  ai: {
    getCompletion: (text: string) => Promise<string>;
  };
}
