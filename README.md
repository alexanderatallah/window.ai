# window.ai

This is a browser extension that helps you use and explore zero-dependency, decentralized AI apps.

- [window.ai](#windowai)
  - [How it works](#how-it-works)
    - [Demo: *TODO*](#demo-todo)
    - [Installation](#installation)
  - [How to build a decentralized app](#how-to-build-a-decentralized-app)
  - [Contributing](#contributing)
    - [Getting Started](#getting-started)
    - [Making production build](#making-production-build)

## How it works

Users configure their keys and language models once in the extension; after that, any JavaScript app can request your permission to use them.

It works with closed models like OpenAI's GPT-3.5 and GPT-4, along with open models like Alpaca that can [run locally](https://github.com/alexanderatallah/Alpaca-Turbo/blob/main/api.py)!

### Demo: *TODO*

### Installation

This project is in beta and not on stores yet. For now, you can join the [#beta-testing channel on Discord](https://discord.gg/KBPhAPEJNj) to get access to a downloadable extension that you can load into Chrome.

## How to build a decentralized app

To leverage user-managed models in your app, simply call:

```ts
const output: Output = await window.ai.getCompletion(
    input: Input,
    options: CompletionOptions = {}
  )
```

All public types can be viewed in [this file](/src/public-interface.ts). `Input` allows you to use both simple strings and [ChatML](https://github.com/openai/openai-python/blob/main/chatml.md). Example of streaming results to the console:

```ts
await ai.getCompletion({
  messages: [{role: "system", content: "Who are you?"}]
}, {
  temperature: 1,
  maxTokens: 800,
  onStreamResult: (res) => console.log(res.message.content)
})
```

---

## Contributing

This is a [Plasmo extension](https://docs.plasmo.com/) project.

### Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

### Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.
