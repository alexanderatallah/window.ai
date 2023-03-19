import { useState } from "react"

function IndexOptions() {
  const [data, setData] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h1>Bring your own LLM options</h1>
      <input onChange={(e) => setData(e.target.value)} value={data} />
      <footer>Crafted by ...</footer>{" "}
    </div>
  )
}

export default IndexOptions
