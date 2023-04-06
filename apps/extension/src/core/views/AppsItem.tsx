import { Dropdown } from "apps/extension/src/core/components/pure/Dropdown"
import { Logo } from "apps/extension/src/core/components/pure/Logo"
import { Splitter } from "apps/extension/src/core/components/pure/Splitter"
import { Text } from "apps/extension/src/core/components/pure/Text"
import { Well } from "apps/extension/src/core/components/pure/Well"
import { Origin, originManager } from "apps/extension/src/core/managers/origin"

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
          choices={["allow", "ask"]}
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
