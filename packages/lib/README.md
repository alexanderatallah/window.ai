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
ai.getCompletion(...)
ai.addEventListener(...)
```
