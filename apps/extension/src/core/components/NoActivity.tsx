import { Text } from "./pure/Text"

export function NoActivity() {
  return (
    <div className="flex flex-col p-8">
      <Text size="lg" align="center" strength="medium">
        Nothing here yet
      </Text>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        <a
          className="text-indigo-800 font-medium dark:text-white"
          href="https://openrouter.ai"
          target="_blank"
          rel="noreferrer">
          Explore
        </a>{" "}
        window.ai apps, or join the{" "}
        <a
          className="text-indigo-800 font-medium dark:text-white"
          href="https://discord.gg/vDAvbuySYv"
          target="_blank"
          rel="noreferrer">
          community
        </a>
        .
      </p>
    </div>
  )
}
