# window.ai

This is a browser extension that helps you discover and use zero-dependency, possibly-decentralized AI apps.

Demo: *TODO*

**Table of Contents**

- [window.ai](#windowai)
  - [How it works](#how-it-works)
  - [Installation](#installation)
  - [How to build a window.ai app](#how-to-build-a-windowai-app)
  - [Contributing](#contributing)

## How it works

Configure your keys and language models once in the extension; after that, any JavaScript app can request your permission to send a prompt to your chosen model(s).

It works with closed models like OpenAI's GPT-3.5 and GPT-4, along with open models like Alpaca that can [run locally](https://github.com/alexanderatallah/Alpaca-Turbo/blob/main/api.py)!

## Installation

This project is in beta and not on stores yet. For now, you can join the [#beta-testing channel on Discord](https://discord.gg/KBPhAPEJNj) to get access to a downloadable extension that you can load into Chrome.

## How to build a window.ai app

To leverage user-managed models in your app, simply call `await window.ai.getCompletion` with your prompt and options.

Example:

```ts
const response: Output = await window.ai.getCompletion(
    { messages: [{role: "user", content: "Who are you?"}] }: Input
  )

console.log(response.message.content) // "I am an AI language model"
```

All public types are documented in [this file](/src/public-interface.ts). `Input`, for example, allows you to use both simple strings and [ChatML](https://github.com/openai/openai-python/blob/main/chatml.md).

Example of streaming GPT-4 results to the console:

```ts
await ai.getCompletion({
  messages: [{role: "user", content: "Who are you?"}]
}, {
  temperature: 0.7,
  maxTokens: 800,
  model: ModelID.GPT4,
  onStreamResult: (res) => console.log(res.message.content)
})
```

Note that `getCompletion` will return an array, `Output[]`, if you specify `numOutputs > 1`.

---

## Contributing

This is a [Plasmo extension](https://docs.plasmo.com/) project. To run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

**Making production build**

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.
