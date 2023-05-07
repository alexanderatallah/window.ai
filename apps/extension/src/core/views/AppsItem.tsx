import { Dropdown } from "~core/components/pure/Dropdown"
import { Logo } from "~core/components/pure/Logo"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import { Well } from "~core/components/pure/Well"
import type { Origin } from "~core/managers/origin"
import { originManager } from "~core/managers/origin"

export function AppsItem({ origin }: { origin: Origin }) {
  const { object, setObject } = originManager.useObject(origin.id)
  const url = object && originManager.url(object)

  return (
    <div className="pb-8">
      <div className="grid grid-cols-6">
        <Logo className="w-7 self-top mr-3 mt-4" faviconFor={origin.domain} />
        <div className="col-span-5">
          <Text size="lg" strength="bold">
            {origin.title}
          </Text>
          <Text dimming="less" truncate>
            <a href={url} title={url} target="_blank">
              {originManager.urlDisplay(origin)}
            </a>
          </Text>
        </div>
      </div>
      <div className="mt-8" />
      <Well>
        <div className="-my-3">
          <Text strength="medium" dimming="less">
            Permissions
          </Text>
        </div>
        <Splitter />
        <Dropdown
          choices={["allow", "ask"] as const}
          onSelect={(permission) =>
            setObject({
              ...origin,
              permissions: permission
            })
          }>
          {object?.permissions === "allow" ? "Always allow" : "Ask"}
        </Dropdown>
      </Well>
    </div>
  )
}
