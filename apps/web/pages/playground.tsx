import { Layout } from "@vercel/examples-ui"

function PlaygroundPage() {
  return (
    <div className="flex flex-col h-screen gap-3 p-8 bg-gray-1 text-gray-11">
      <input
        className="w-full p-2 rounded-lg bg-gray-3"
        placeholder="Set the Primary Goal"
      />

      <div className="flex wrap w-full"></div>
    </div>
  )
}

PlaygroundPage.Layout = Layout

export default PlaygroundPage
