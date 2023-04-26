import clsx from "clsx"
import type { TextareaHTMLAttributes } from "react"
import { useState, type FC } from "react"
import { useAgentManager } from "~core/providers/useAgentManager"
import { AgentMonitor } from "~features/agent/AgentMonitor"

const Input: FC<TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={clsx(
      "w-full p-2",
      "rounded-lg",
      "bg-slate-1 focus:bg-slate-2 border-slate-7",
      "focus:border-slate-8 focus:outline-slate-7",
      "text-slate-11 focus:text-slate-12"
    )}
  />
)

const defaultName = "Mars Civil Engineer"
const defaultPurpose = "Plan out the blueprint of a base on Mars"
const defaultDescription =
  "A resourceful civil engineer whose goal is to plan out each and every detail of how a base on Mars might operate in the first 2 years. Diligent, detailed, resourceful."

export const AgentHiringCard = () => {
  const { addAgent } = useAgentManager()

  // Use default for testing, future iteration prob just use empty string
  const [name, setName] = useState(defaultName)
  const [purpose, setPurpose] = useState(defaultPurpose)
  const [description, setDescription] = useState(defaultDescription)

  return (
    <AgentMonitor
      name={
        <Input
          rows={1}
          placeholder="Agent Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      }
      purpose={
        <Input
          rows={1}
          placeholder="Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      }
      description={
        <Input
          rows={4}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      }>
      <button
        className={clsx(
          "p-2",
          "m-2",
          "rounded-lg",
          "bg-slate-9 hover:bg-slate-10",
          "text-slate-12"
        )}
        onClick={() => {
          setName("")
          setPurpose("")
          setDescription("")

          addAgent({
            description,
            name,
            purpose
          })
        }}>
        Recruit
      </button>
    </AgentMonitor>
  )
}
