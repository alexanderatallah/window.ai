# Window: use your own AI models on the web

[![](https://dcbadge.vercel.app/api/server/KBPhAPEJNj?style=flat)](https://discord.gg/KBPhAPEJNj)

Window is a browser extension that lets you use model-polymorphic AI apps.

- **For developers**: free from API costs and limits - just use the injected `window.ai` library
  
- **For users**: use your preferred model, whether it's external (like OpenAI), proxied, or local, to protect privacy.

More about why this was made [here](https://twitter.com/xanderatallah/status/1643356106670981122).

Below, you'll find 

### 📺 Demo
https://user-images.githubusercontent.com/1011391/230610706-96755450-4a3b-4530-b19f-5ae405a31516.mp4

### ℹ️ Contents

- [Window: use your own AI models on the web](#window-use-your-own-ai-models-on-the-web)
    - [📺 Demo](#-demo)
    - [ℹ️ Contents](#ℹ️-contents)
  - [⭐️ Main features](#️-main-features)
  - [⚙️ How it works](#️-how-it-works)
  - [📥 Installation](#-installation)
  - [👀 Find apps](#-find-apps)
  - [📄 Docs](#-docs)
    - [❔ Why should I build with this?](#-why-should-i-build-with-this)
    - [🧑‍💻 Getting started](#-getting-started)
    - [✏️ Reference](#️-reference)
  - [🧠 Local model setup](#-local-model-setup)
    - [Server API Spec](#server-api-spec)
    - [Demo comparing Alpaca with GPT-4](#demo-comparing-alpaca-with-gpt-4)
  - [🤝 Contributing](#-contributing)

## ⭐️ Main features

- 🛠️ Configure all your API keys in one place and forget about them. They are *only* stored locally.

- 🧠 Use external, proxied, and local models of your choice.

- 💾 Save your prompt history across apps (maybe train your own models with it).

## ⚙️ How it works

1. You configure your keys and models just once (see [demo](#📺-demo) above).

2. Apps can request permission to send prompts to your chosen model via the injected `window.ai` library (see the simple [docs](#📄-docs)).

3. You maintain visibility on what's being asked and when.

It works with these models:

- OpenAI's [GPT-3.5 and GPT-4](https://platform.openai.com/)
- Together's [GPT NeoXT 20B](https://github.com/togethercomputer/OpenChatKit/blob/main/docs/GPT-NeoXT-Chat-Base-20B.md)
- Cohere [Xlarge](https://dashboard.cohere.ai/)
- Open models, like Alpaca, that can run locally (see [how](#🧠-local-model-setup)).

## 📥 Installation

This project is in beta and not on stores yet. For now, you can join the [#beta-testing channel on Discord](https://discord.gg/KBPhAPEJNj) to get access to a downloadable extension that you can load into Chrome.

## 👀 Find apps

Better ways of doing this are coming soon, but today, you can use the [Discord #app-showcase channel](https://discord.gg/6kMeRxc2TE) to discover new `window.ai`-compatible apps, or you can browse user-submitted ones on aggregators:

- [Skylight](https://www.skylightai.io/)

## 📄 Docs

This section shows why and how to get started, followed by a reference of `window.ai` methods.

### ❔ Why should I build with this?

As a developer, one of the primary reasons to use `window.ai` instead of API calls is **reducing your infrastructure burden**. No more model API costs, timeouts, rate limiting, and server billing time.

Plus, depending on what you make, you may have no need to make code changes when new models come out, like GPT-4, or when users need to switch between them.

### 🧑‍💻 Getting started

To leverage user-managed models in your app, simply call `await window.ai.getCompletion` with your prompt and options.

Example:

```ts
const response: Output = await window.ai.getCompletion(
    { messages: [{role: "user", content: "Who are you?"}] }: Input
  )

console.log(response.message.content) // "I am an AI language model"
```

All public types, including error messages, are documented in [this file](/apps/extension/src/public-interface.ts). `Input`, for example, allows you to use both simple strings and [ChatML](https://github.com/openai/openai-python/blob/main/chatml.md).

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

### ✏️ Reference

Better version coming soon. In the meantime, all public types, including error messages, are documented in [this file](/apps/extension/src/public-interface.ts). There are just two functions in the library:

**Current model**: get the user's currently preferred model ID.
```ts
window.ai.getCurrentModel(): Promise<ModelID> 
```

**Get completion**: get or stream a completion from the specified (or preferred) model.
```ts
window.ai.getCompletion(
    input: Input,
    options: CompletionOptions = {}
  ): Promise<Output | Output[]>
```
`Input` is either a `{ prompt : string }` or `{ messages: ChatMessage[]}`. Examples: see [getting started](#🧑‍💻-getting-started) above.


## 🧠 Local model setup


You can configure any local model to work with Window by writing a compatible server!

The Window extension has been tested with [Alpaca](https://github.com/tatsu-lab/stanford_alpaca) running locally behind a simple HTTP server.

Here are instructions for setting up an Alpaca server locally with FastAPI and Uvicorn: [Alpaca Turbo](https://github.com/alexanderatallah/Alpaca-Turbo#using-the-api).


### Server API Spec

**Types**

- `ChatMessage`: `{"role": string, "content": string}`

**POST `/completions`**

This endpoint accepts a request body containing the following parameters:

- `model`: A string identifier for the model type to use.
- `prompt`: The prompt(s) to generate completions for, encoded as a `string`. OR you can use ChatML format via `messages`:
- `messages` an array of `ChatMessage`s.
- `max_tokens`: The maximum number of tokens to generate in the completion.
- `temperature`: What sampling temperature to use, between 0 and 2.
- `stop_sequences`: A string or array of strings where the API will stop generating further tokens. The returned text will not contain the stop sequence.
- `stream`: A boolean representing whether to stream generated tokens, sent as data-only server-sent events as they become available. Defaults to false.
- `num_generations`: How many choices to generate (should default to 1).

**Note:** apps like `windowai.io` will ask to stream, so your local server might not work with them until you support streaming.

**Return value:**

This endpoint should return an object that looks like: `{ "choices": Array<{ text: string }`.

More WIP thinking [here](https://alexatallah.notion.site/RFC-LLM-API-Standard-c8f15d24bd2f4ab98b656f08cdc1c4fb).

### Demo comparing Alpaca with GPT-4

[Demo context](https://twitter.com/xanderatallah/status/1643356112073129985)

https://user-images.githubusercontent.com/1011391/230620781-57b8ffdb-4081-488c-b059-0daca5806b5a.mp4

## 🤝 Contributing

This is a turborepo monorepo containing:

1. A [Plasmo extension](https://docs.plasmo.com/) project.
2. A web app serving [windowai.io](https://windowai.io).
3. Upcoming packages to help developers (see Discord for more info).


**To run the extension and the web app in parallel:**

```bash
pnpm dev
```

**To build them both:**

```bash
pnpm build
```

After building, open your browser and load the appropriate development build by [loading an unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked). For example, if you are developing for the Chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.
