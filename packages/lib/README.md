# Official window.ai client library.

This is the official window.ai client library for Node.js. It provides convenient access to the window.ai API for client and server-side applications.

# Usage

```ts

import { initWindowAi } from 'window-ai';

// initialize the client

const ai = await initWindowAi()

ai.getCurrentModel()
ai.getCompletion(...)
ai.addEventListener(...)
```
