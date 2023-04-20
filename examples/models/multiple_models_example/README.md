# Examples: Multiple Models

*This is a Window demo app which shows how you can use multiple local models on the same endpoint.*

## Installation and Running

1. Download this folder.
2. `pip install -r requirements.txt`
3. Create a `.env` file which contains sets your `OPENAI_API_KEY=<secret_key>`.
4. Run by opening `index.html` in your browser. If you are on Chrome (or Brave) you will need to allow local file access for the Window.ai extension. To do this, type "chrome://extensions/" in the address bar, click "Details" under Window.ai, and then click "Allow access to file URLs".

## How It Works

1. First, give example code that you want ChatGPT to generate code with. That snippet is embedded into a vector index which helps us fit it into the context window of ChatGPT (if your snippet is long). For the sake of the demo, it is saved locally on disk for persistent storage.
2. Then in the following textbox, you can prompt ChatGPT to generate code based on the code snippet.
3. Finally, ChatGPT is used to query the embedding with your instructions, and the output is displayed in the final row.