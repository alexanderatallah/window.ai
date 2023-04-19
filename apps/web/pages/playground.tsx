import { Layout } from "@vercel/examples-ui"
import { InputMessage } from "../components/InputMessage"
import { useWindowAI } from "../components/hooks/useWindowAI"
import clsx from "clsx"

const Agent = ({ name = "Agent Name", purpose = "Purpose" }) => {
  return (
    <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
      <div className="flex flex-col rounded-lg bg-slate-3 ">
        <div className="bg-slate-6 p-2 rounded-t-lg">
          <h3 className="font-bold">{name}</h3>
          <h4 className="text-xs">{purpose}</h4>
        </div>
        <ul className={clsx("p-2 max-h-40 overflow-auto", "flex flex-col")}>
          <li>Hello world</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
        </ul>
      </div>
    </div>
  )
}

function PlaygroundPage() {
  const { input, setInput, sendMessage, messages } = useWindowAI([])

  return (
    <div className="flex flex-col gap-3 p-8 min-h-screen bg-slate-1 text-slate-11">
      <h2 className="text-2xl text-center font-bold text-slate-11">
        Agent Playground
      </h2>
      <div className="flex">
        <InputMessage
          placeholder="Enter Primary Goal"
          buttonText="Set"
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
      </div>

      <div className="flex flex-wrap w-full">
        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />

        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />

        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
        <Agent
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
      </div>
    </div>
  )
}

PlaygroundPage.Layout = Layout

export default PlaygroundPage
