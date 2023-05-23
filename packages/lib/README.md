# Official window.ai client library.

This is the official window.ai client library. It provides the base `WindowAI` interface. The `window.ai` browser extension implements this interface to expose the window.ai API to web applications. Any web application can leverage this client library to consume the `window.ai` API.

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

ModelID is an enum of the available models, which are available as an
TypeScript enum:
```ts
import { ModelID, parseModelID } from 'window.ai'

const model: ModelID = parseModelID(rawString)
```

`ModelID` contains a list of model identifiers that follow
the [Hugging Face format](https://huggingface.co/docs/transformers/main_classes/model) as closely
as possible. This is an evolving standard, and may change in the future.

Some examples:

```ts
// "/" Splits the organization's name from the model name
"openai/gpt-3.5-turbo"
"openai/gpt-4"
"anthropic/claude-instant"
"togethercomputer/GPT-NeoXT-Chat-Base-20B"
"cohere/command-nightly"
// "Local" is a special ModelID that represents an unknown model handler
// running locally on the user's computer.
"local"
```