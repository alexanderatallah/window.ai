# Official window.ai client library.

This is the official `window.ai` client library. It provides the base interface for authenticating and using client-side AI.

The Window AI browser extension implements this interface to inject `ai` into the global `window`, thereby exposing the `window.ai` API to web applications without the need for any dependencies on their part. But any web application can leverage this client library to consume the `window.ai` API and add typechecking to it.

**Note**: you can interact with window.ai directly without dependencies (i.e this client library). The library's key benefits for API consumers are:

- Checking for `window.ai` installation
- Type errors and type checking
- Utilities/helpers

# Usage

```ts

import { getWindowAI } from 'window.ai';

// initialize the client

const ai = await getWindowAI()

ai.getCurrentModel()
ai.generateText(...)
ai.addEventListener(...)
```

### Model IDs

ModelID is an enum of the available models, which are available as a
TypeScript enum:

```ts
import { ModelID, parseModelID } from "window.ai"

const model: ModelID = parseModelID(rawString)
```

`ModelID` contains a list of model identifiers that follow
the [Hugging Face format](https://huggingface.co/docs/transformers/main_classes/model) as closely
as possible.

Some examples:

```ts
// "/" Splits the organization's name from the model name
"openai/gpt-3.5-turbo"
"openai/gpt-4"
"anthropic/claude-instant-v1"
"anthropic/claude-instant-v1-100k"
"anthropic/claude-v1"
"anthropic/claude-v1-100k"
"togethercomputer/GPT-NeoXT-Chat-Base-20B"
"cohere/command-nightly"
// "Local" is a special ModelID that represents an unknown model handler
// running locally on the user's computer.
"local"
```

**NOTE**: This is an evolving standard, and may change in the future. We are currently providing
backwards compatibility within the Window AI extension for old model identifiers. See
[DeprecatedModelID](/packages/lib/src/model-id.ts) for examples.
