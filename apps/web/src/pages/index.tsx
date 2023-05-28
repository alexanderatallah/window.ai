import { Layout, Text } from "@vercel/examples-ui"
import { Chat } from "~core/components/Chat"
import { CodeBlock } from "~core/components/CodeBlock"
import Link from "next/link"
import Image from "next/image"
import {
  ANNOUNCEMENT_URL,
  DISCORD_URL,
  GITHUB_URL
} from "~core/components/common"
import { Button } from "~core/components/Button"
import { GetExtensionButton } from "~core/components/GetExtensionButton"

const windowaiExample = `
// Code for streaming a response
// from a user's Window AI model
await window.ai.generateText(
  {
    prompt: "Hello world!"
  },
  {
    onStreamResult: (res) =>
      console.log(result.text)
  }
)
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
    <div className="flex flex-col gap-3 w-full">
      <section className="flex flex-col gap-6 max-w-5xl mx-auto px-8 w-full pt-16">
        <Text variant="h1" className="text-slate-12">
          Window
        </Text>
        <Text variant="h2" className="text-slate-12">
          Use your own AI models on the web
        </Text>

        <div className="grid grid-cols-6 gap-6">
          <Text className="text-zinc-9 md:col-span-4 col-span-6">
            Users, not developers, choose which model to use with apps{" "}
            <Link className="underline" href={GITHUB_URL} target="_blank">
              built on window.ai
            </Link>
            . <br />
            This example shows a chatbot implemented with{" "}
            <strong>no API keys</strong> and no backend.
          </Text>
          <div className="md:col-span-2 col-span-6">
            <GetExtensionButton />
          </div>
        </div>
      </section>

      <Section>
        <div className="flex justify-between w-full md:space-x-4 md:flex-row flex-col space-y-8 md:space-y-0">
          <div className="w-full h-screen md:h-auto">
            <Chat />
          </div>
          <div className="w-full md:w-96">
            <CodeBlock language="javascript" value={windowaiExample} />
          </div>
        </div>
      </Section>

      <div className="bg-slate-4">
        <Section>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center ">
            <div className="max-w-lg p-10 flex flex-col space-y-4">
              <Text variant="h2" className="text-slate-12">
                You control your AI
              </Text>
              <Text>
                The Window extension allows you to configure the models you use
                on the web. No API keys needed.
                <br />
                <br />
                You can choose from OpenAI, Anthropic, Together, Cohere, or even
                an AI{" "}
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
              className="flex-grow shadow-md m-12 rounded-xl"
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
            className="flex-grow shadow-md m-12 rounded-xl"
          />
          <div className="max-w-lg p-10 flex flex-col space-y-4">
            <Text variant="h2" className="text-slate-12">
              Save your history
            </Text>
            <Text>
              The Window extension keeps a history of all the messages you send
              and receive. You can use this history to train your own AI models.
            </Text>
          </div>
        </div>
      </Section>

      <div className="bg-slate-4">
        <Section>
          <div className="justify-between w-full flex flex-col sm:flex-row items-center">
            <div className="max-w-lg p-10 flex flex-col space-y-4">
              <Text variant="h2" className="text-slate-12">
                Learn more
              </Text>
              <Text>
                Read the{" "}
                <Link
                  className="underline"
                  href={ANNOUNCEMENT_URL}
                  target="_blank">
                  announcement
                </Link>
              </Text>
              <Text>
                Check out the{" "}
                <Link className="underline" href={GITHUB_URL} target="_blank">
                  docs
                </Link>
              </Text>
              <GetExtensionButton isPlain className="w-44" />
              <Link href={DISCORD_URL} target="_blank" className="w-44">
                <Button>Join the community</Button>
              </Link>
            </div>
            <video
              width="500"
              controls
              className="flex-grow shadow-md m-12 rounded-xl">
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
