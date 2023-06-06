# Window: use your own AI models on the web

[![](https://dcbadge.vercel.app/api/server/KBPhAPEJNj?style=flat)](https://discord.gg/KBPhAPEJNj)

Window AI is a browser extension that lets you configure AI models in one place and use them on the web.

- **For developers**: easily make multi-model apps free from API costs and limits - just use the injected `window.ai` library. Leverage decentralized AI.

- **For users**: control the AI you use on the web, whether it's external (like OpenAI), proxied, or local, to protect privacy.

- **For model providers**: plug into an ecosystem of users without requiring developers to change their apps.

More about why this was made [here](https://twitter.com/xanderatallah/status/1643356106670981122).

Below, you'll find out [how to install](#-installation), [how to find apps](#-find-apps), [how to make apps](#-docs), and [how to connect custom models](#-local-model-setup).

### 📺 Demo

https://user-images.githubusercontent.com/1011391/230610706-96755450-4a3b-4530-b19f-5ae405a31516.mp4

### ℹ️ Contents

- [Window: use your own AI models on the web](#window-use-your-own-ai-models-on-the-web)
    - [📺 Demo](#-demo)
    - [ℹ️ Contents](#ℹ️-contents)
  - [⭐️ Main features](#️-main-features)
  - [⚙️ How it works](#️-how-it-works)
  - [📥 Installation](#-installation)
    - [Browser support](#browser-support)
    - [Beta builds](#beta-builds)
  - [👀 Find apps](#-find-apps)
  - [📄 Docs](#-docs)
    - [Why should I build with this?](#why-should-i-build-with-this)
    - [Getting started](#getting-started)
    - [Functions](#functions)
    - [CompletionOptions](#completionoptions)
    - [Model ID Standard](#model-id-standard)
    - [Error codes](#error-codes)
    - [Community tools](#community-tools)
  - [🧠 Local model setup](#-local-model-setup)
    - [Server API Spec](#server-api-spec)
    - [Demo comparing Alpaca with GPT-4](#demo-comparing-alpaca-with-gpt-4)
  - [🤝 Contributing](#-contributing)

## ⭐️ Main features

- **Configure keys**: set all your API keys in one place and forget about them. They are _only_ stored locally.

- **User-controlled models**: use external, proxied, and local models of your choice.

- **Save your prompt history** across apps (maybe train your own models with it).

## ⚙️ How it works

1. You configure your keys and models just once in the extension (see [demo](#📺-demo) above).

2. Apps can request permission to send prompts to your chosen model via the injected `window.ai` library (see the simple [docs](#📄-docs)).

3. You maintain visibility on what's being asked and when.

It works with these models:

- OpenAI's [GPT-3.5 and GPT-4](https://platform.openai.com/)
- Together's [GPT NeoXT 20B](https://github.com/togethercomputer/OpenChatKit/blob/main/docs/GPT-NeoXT-Chat-Base-20B.md)
- Cohere [Xlarge](https://dashboard.cohere.ai/)
- Open models, like Alpaca, that can run locally (see [how](#🧠-local-model-setup)).

## 📥 Installation

Download the Chrome extension here: https://chrome.google.com/webstore/detail/window-ai/cbhbgmdpcoelfdoihppookkijpmgahag

### Browser support
✅ [Chrome](https://chrome.google.com/webstore/detail/window-ai/cbhbgmdpcoelfdoihppookkijpmgahag)
✅ [Brave](https://chrome.google.com/webstore/detail/window-ai/cbhbgmdpcoelfdoihppookkijpmgahag)
✏️ Microsoft Edge
✏️ Firefox
✏️ Safari: https://github.com/alexanderatallah/window.ai/issues/20

### Beta builds
You can join the [#beta-builds channel on Discord](https://discord.gg/KBPhAPEJNj) to get early access to features being tested and developed by the community.

## 👀 Find apps

Better ways of doing this are coming soon, but today, you can use the [Discord #app-showcase channel](https://discord.gg/6kMeRxc2TE) to discover new `window.ai`-compatible apps, or you can browse user-submitted ones on aggregators:

- [Skylight](https://www.skylightai.io/)

## 📄 Docs

This section shows why and how to get started, followed by a reference of `window.ai` methods.

### Why should I build with this?

**Infrastructure burden**: No more model API costs, timeouts, rate limiting. Reduced server billing time.

**Easily go multi-model**. Integrate once, and then let Window handle model upgrades and support for other providers.

**Privacy**: Now you can build privacy-conscious apps that just talk to the user's choice of model, and you have less liability for the model's output.

### Getting started

To leverage user-managed models in your app, simply call `await window.ai.generateText` with your prompt and options.

Example:

```ts
const [ response ] : Output[] = await window.ai.generateText(
    { messages: [{role: "user", content: "Who are you?"}] }: Input
  )

console.log(response.message.content) // "I am an AI language model"
```

All public types, including error messages, are available with comments in the [window.ai library](/packages/lib/src/index.ts). Jump down to `export interface WindowAI` to see the type of the root object.

`Input`, for example, allows you to use both simple strings and [ChatML](https://github.com/openai/openai-python/blob/main/chatml.md).

Example of streaming GPT-4 results to the console:

```ts
const [ { message } ] = await window.ai.generateText(
  {
    messages: [{ role: "user", content: "Who are you?" }]
  },
  {
    temperature: 0.7,
    maxTokens: 800,
    model: ModelID.GPT_4,
    // Handle partial results if they can be streamed in
    onStreamResult: (res) => console.log(res.message.content)
  }
)
console.log("Full ChatML response: ", message)
```

Note that `generateText` will return an array, `Output[]`, that only has multiple elements if `numOutputs > 1`.

This **does not guarantee that the length of the return result will equal `numOutputs`**. If the model doesn't support multiple choices, then only one choice will be present in the array.

The `onStreamResult` handler is similar. You should rely on the promise resolution and only use this
handler to improve UX, since not all models and config options support it.

### Functions

The Window API is simple. Just a few functions:

**Generate Text**: generate text from a specified model or the user-preferred model.

```ts
window.ai.generateText(
    input: Input,
    options: CompletionOptions = {}
  ): Promise<Output[]>
```

`Input` is either a `{ prompt : string }` or `{ messages: ChatMessage[]}`. Examples: see [getting started](#🧑‍💻-getting-started) above.

**Current model**: get the user's currently preferred model. Will be undefined if their chosen model 
provider doesn't have a model lookup, or the model is unknown.

```ts
window.ai.getCurrentModel(): Promise<ModelID | undefined>
```

**Listen to events**: to listen to events emitted by the extension, such as whenever the preferred model changes, here's what you do:

```ts
window.ai.addEventListener((event: EventType, data: unknown) => {
  // You can check `event` to see if it's the EventType you care about, e.g. "model_changed"
  console.log("EVENT received", event, data)
})
```

All public types, including error messages, are documented in the [window.ai library](/packages/lib/src/index.ts). Highlights below:

### CompletionOptions

This options dictionary allows you to specify options for the completion request.

```ts
export interface CompletionOptions {
  // If specified, partial updates will be streamed to this handler as they become available,
  // and only the first partial update will be returned by the Promise.
  // This only works if 1) the chosen model supports streaming and
  // 2) `numOutputs` below is not > 1. Otherwise, it will be ignored, and the
  // whole result will be in the promise's resolution
  onStreamResult?: (result: Output | null, error: string | null) => unknown

  // What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
  // make the output more random, while lower values like 0.2 will make it more focused and deterministic.
  // Different models have different defaults.
  temperature?: number

  // How many completion choices to generate. Defaults to 1.
  numOutputs?: number

  // The maximum number of tokens to generate in the chat completion. Defaults to infinity, but the
  // total length of input tokens and generated tokens is limited by the model's context length.
  maxTokens?: number

  // Sequences where the API will stop generating further tokens.
  stopSequences?: string[]

  // Identifier of the model to use. Defaults to the user's current model, but can be overridden here.
  // Arbitrary strings are allowed, and will be passed to the Local model as `model`.
  // NOTE: this standard is evolving - recommend not using this if you're making an immutable app.
  model?: ModelID | string
}
```

### Model ID Standard

`ModelID` is an enum of the available models, which are available as a
TypeScript enum inside `window.ai`. See the library's [README](/packages/lib/README.md).

### Error codes

Errors emitted by the extension API:

```ts
export enum ErrorCode {
  // Incorrect API key / auth
  NotAuthenticated = "NOT_AUTHENTICATED",

  // User denied permission to the app
  PermissionDenied = "PERMISSION_DENIED",

  // Happens when a permission request popup times out
  RequestNotFound = "REQUEST_NOT_FOUND",

  // When a request is badly formed
  InvalidRequest = "INVALID_REQUEST",

  // When an AI model refuses to fulfill a request. The returned error is
  // prefixed by this value and includes the status code that the model API returned
  ModelRejectedRequest = "MODEL_REJECTED_REQUEST"
}
```

### Community tools

Hope to eventually make an `awesome-window.ai` repo, but in the meantime:

- **🪄 [Wanda](https://github.com/haardikk21/wanda)**: React Hooks for working with `window.ai`

## 🧠 Local model setup

You can configure any local model to work with Window-compatible apps by writing a simple HTTP server.

Here are instructions for setting up an [Alpaca](https://github.com/tatsu-lab/stanford_alpaca) server locally with FastAPI and Uvicorn: [Alpaca Turbo](https://github.com/alexanderatallah/Alpaca-Turbo#using-the-api).

### Server API Spec

**Types**

- `ChatMessage`: `{"role": string, "content": string}`

**POST `/completions`**

Generate text to complete a prompt or list of messages.
This endpoint accepts a request body containing the following parameters:

- `prompt`: The prompt(s) to generate completions for, encoded as a `string`. OR you can use ChatML format via `messages`:
- `messages` an array of `ChatMessage`s.
- `model`: a string representing the type of model being requested. ex: `ModelID.GPT_4`
- `max_tokens`: The maximum number of tokens to generate in the completion.
- `temperature`: What sampling temperature to use, between 0 and 2.
- `stop_sequences`: A string or array of strings where the API will stop generating further tokens. The returned text will not contain the stop sequence.
- `stream`: A boolean representing whether to stream generated tokens, sent as data-only server-sent events as they become available. Defaults to false.
- `num_generations`: How many choices to generate (should default to 1).

**Note:** apps like `windowai.io` will ask to stream, so your local server might not work with them until you support streaming.

**Return value:**

This endpoint should return an object that looks like:

```ts
{
  choices: Array<{ text: string }>
}
```

**POST `/model`**

Get the model that will be used for the given prompt and completion options
This endpoint accepts a request body containing the same parameters as the `/completions` endpoint above.

**Return value:**

This endpoint should return an object that looks like:

```ts
{
  id: string
}
```

Where `id` is a string identifying the model, such as a known [ModelID](#model-id-standard).

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
