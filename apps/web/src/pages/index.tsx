import { Layout, Text } from "@vercel/examples-ui"
import { Chat } from "~components/Chat"
import { CodeBlock } from "~components/CodeBlock"
import Link from "next/link"
import Image from "next/image"
import {
  ANNOUNCEMENT_URL,
  DISCORD_URL,
  EXTENSION_CHROME_URL,
  GITHUB_URL
} from "~components/common"
import { Button } from "~components/Button"

const windowaiExample = `
// Get the active model from the window.ai API 
await window.ai.getCurrentModel()

// Get completions from the window.ai API
await window.ai.getCompletion(
  {
    messages: [...last10messages],
  },
  {
    onStreamResult: (result: any, error: any) => {
      console.log(result.message.content)
    },
  })
`

const Section = ({ children }: any) => {
  return (
    <section className="flex flex-col gap-3 w-full max-w-5xl mx-auto px-8 pb-20">
      {children}
    </section>
  )
}

function Home() {
  return (
    <div className="flex flex-col gap-3 w-full py-16">
      <section className="flex flex-col gap-6 max-w-5xl mx-auto px-8 w-full">
        <Text variant="h1">Window</Text>
        <Text variant="h2">Use your own AI models on the web</Text>

        <div className="grid grid-cols-6 gap-6">
          <Text className="text-zinc-600 md:col-span-4 col-span-6">
            In this example, a simple chatbot is implemented in one file, with{" "}
            <strong>no backend.</strong>
            <br />
            Users, not developers, choose which model to use with apps{" "}
            <Link className="underline" href={GITHUB_URL} target="_blank">
              built on window.ai
            </Link>
            .
          </Text>
          <a
            href={EXTENSION_CHROME_URL}
            target="_blank"
            className="inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none
        font-semibold text-zinc-10 active:bg-zinc-800 active:text-zinc-100/70
           bg-indigo-600 hover:bg-indigo-500 md:col-span-2 col-span-6 text-white">
            Get the extension
          </a>
        </div>
      </section>

      <Section>
        <div className="flex justify-between w-full md:space-x-4 md:flex-row flex-col space-y-8 md:space-y-0">
          <CodeBlock language="js" value={windowaiExample} />
          <div className="w-full">
            <Chat />
          </div>
        </div>
      </Section>

      <div className="bg-slate-300">
        <Section>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center ">
            <div className="max-w-lg p-10 flex flex-col space-y-4">
              <Text variant="h2">You control your AI</Text>
              <Text className="text-zinc-600">
                The Window extension allows you to configure the models you use
                on the web. You can choose from OpenAI, Together, Cohere, or
                even an AI{" "}
                <Link
                  className="underline"
                  href="https://github.com/alexanderatallah/Alpaca-Turbo#using-the-api"
                  target="_blank">
                  running on your computer
                </Link>{" "}
                if you need privacy.
              </Text>
            </div>
            <Image
              src="/configure.png"
              width={1000}
              height={1000}
              alt="configure"
              className="flex-grow shadow-md m-12"
            />
          </div>
        </Section>
      </div>

      <Section>
        <div className="justify-between w-full flex flex-col sm:flex-row items-center">
          <Image
            src="/history.png"
            width={1000}
            height={1000}
            alt="history"
            className="flex-grow shadow-md m-12"
          />
          <div className="max-w-lg p-10 flex flex-col space-y-4">
            <Text variant="h2">Save your history</Text>
            <Text className="text-zinc-600">
              The Window extension keeps a history of all the messages you send
              and receive. You can use this history to train your own AI models.
            </Text>
          </div>
        </div>
      </Section>

      <div className="bg-slate-300">
        <Section>
          <div className="justify-between w-full flex flex-col sm:flex-row items-center">
            <div className="max-w-lg p-10 flex flex-col space-y-4">
              <Text variant="h2">Learn more</Text>
              <Text className="text-zinc-600">
                Read the{" "}
                <Link
                  className="underline"
                  href={ANNOUNCEMENT_URL}
                  target="_blank">
                  announcement
                </Link>
              </Text>
              <Text className="text-zinc-600">
                Check out the{" "}
                <Link className="underline" href={GITHUB_URL} target="_blank">
                  docs
                </Link>
              </Text>
              <Button
                onClick={() => window.open(EXTENSION_CHROME_URL, "_blank")}
                className=" bg-indigo-600 hover:bg-indigo-500 ">
                Get the extension
              </Button>
              <Button onClick={() => window.open(DISCORD_URL, "_blank")}>
                Join the community
              </Button>
            </div>
            <video width="500" controls className="flex-grow shadow-md m-12">
              <source
                src="https://user-images.githubusercontent.com/1011391/230610706-96755450-4a3b-4530-b19f-5ae405a31516.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </Section>
      </div>
    </div>
  )
}

Home.Layout = Layout

export default Home
