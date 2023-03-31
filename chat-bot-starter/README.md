# ChatGPT Web App with React/Next.js (and Twilio SMS)
<img width="1342" alt="Screen Shot 2022-12-13 at 11 25 51 AM" src="https://user-images.githubusercontent.com/5430709/207388600-c59370c8-36e0-4c13-80e5-d355ebfbc07c.png">


## Join our discord!
If you have any questions post them here! This is still a WIP.
https://discord.gg/SYmACWTf6V


## Getting started

1. Copy `.env.example` to `.env`
2. Add `OPEN_AI_KEY` to the `.env` file

```
OPENAI_API_KEY=<YOUR KEY HERE>
```

3. Generate and add NEXTAUTH_SECRET to `.env` file

```
# Next Auth
# You can generate the secret via 'openssl rand -base64 32' on Linux
NEXTAUTH_SECRET=
```

4. Install and run

```
yarn
yarn dev
```

## Deploy

Deploy to fly.io

1. Create fly account
2. Download fly cli `brew install flyctl`
3. Run Fly Launch `flyctl launch`
4. update fly.toml internal port to 3000
5. `fly secrets set --app gpt3-chat TWILIO_ACCOUNT_SID= TWILIO_AUTH_TOKEN= TWILIO_PHONE_NUMBER= OPENAI_API_KEY= etc...`
6. `fly deploy --local-only`


## Custom Prompt for the chat bot. (Using the `PromptId`)

This starter uses https://promptable.ai to fetch it's prompts.

If you'd like to use your own prompts on Promptable, you can paste in a prompt id. (You can get your prompt id on the deployments tab)

NOTE: To get the chat bot to work correctly, you'll have to add a {{input}} for the chat history like this.

The bot will inject the chat history into a variable called {{input}} in your prompt.

Example: (This is the default prompt btw)

```
Below is a conversation between a knowledgable, helpful, and witty AI assistant and a user, who has some questions about a topic.
The AI assistant is able to answer the user's questions and provide additional information about the topic. The AI assistant is able to
keep the conversation focused on the topic and provide relevant information to the user. The closer the AI agent can get to
answering the user's questions, the more helpful the AI agent will be to the user.

CHAT HISTORY:
{{input}}
Assistant:
```

## T3 Stack

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.


## SMS Support with Twilio (Optional)

Twilio SMS chatbot using GPT3. Based on this [tutorial](https://www.twilio.com/blog/sms-stocks-bot-twilio-typescript).
### Things you will need

* [Node.js](https://nodejs.org/en/) installed on your machine
* A Twilio account (if you don't have one yet, [sign up for a free Twilio account here and receive $10 credit when you upgrade](https://twil.io/philnash))
* A Twilio phone number that can receive SMS messages
* [ngrok](https://ngrok.com/) so that you can [respond to webhooks in your local development environment](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html)
* (Optional) A [Promptable](https://promptable.ai) account for creating / managing prompts.
* (Optional) A Fly.io account for deploying the app

### Create a Twilio Account / Phone Number

Based on this [tutorial](https://www.twilio.com/blog/sms-stocks-bot-twilio-typescript). After your account is created, use this command to create a phone number that can receive SMS messages:

```
twilio phone-numbers:update PHONE_NUMBER --sms-url https://RANDOM_STRING.ngrok.io/messages
```

You'll need the Twilio CLI installed. You'll need to "upgrade" to paid if you want to remove the Twilio branding from the SMS replies.

### Dependencies

Install the dependencies:

```bash
npm install
```

### Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Fill in your TWILIO and OPENAI Keys, and your personal PHONE_NUMBER.

### Compile the TypeScript to JavaScript

Compile the project:

```bash
npm run build
```

Note that this runs the TypeScript compiler, `tsc`, you could also run `npx tsc` to get the same output.

The TypeScript project will be compiled into the `dist` directory. You can also continuously compile the project as it changes with:

```bash
npm run watch
```

### Run the project

Start the web server with:

```bash
npm start
```

### Expose the local server with ngrok

To respond to an incoming webhook you will need a publicly available URL. [ngrok](https://ngrok.com) is a tool that can tunnel through from a public URL to your machine. Once you've [downloaded and installed ngrok](https://ngrok.com/download) you can run it like so:

```bash
ngrok http 3000
```

The ngrok terminal will show you a URL, like `https://RANDOM_STRING.ngrok.io`.

### Connect your phone number to your app

Using the ngrok URL from the last part, you can set up your Twilio phone number with your application. [Edit your phone number](https://www.twilio.com/console/phone-numbers/incoming) and in the Messaging section, next to when "A message comes in" enter your ngrok URL with the path `/messages`.

```
https://RANDOM_STRING.ngrok.io/messages
```

Save the phone number and you are ready. Send your number a message and receive a reply. Type "reset" to reset the chat thread history and bdeing again.

## GPT3 Example Integration

```ts
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const response = await openai.createCompletion({
  model: "text-davinci-003",
  prompt: "Please reply to the chat below:\n",
  temperature: 0.7,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
});
```

## TODOs/ Feature Requests

TODO: Add Voice Chats:
- https://www.twilio.com/docs/voice/twiml/say/text-speech
- https://www.twilio.com/blog/programmable-voice-javascript-quickstart-demo-node
