import { useRef, useState } from "react"

import { NoActivity } from "~core/components/NoActivity"
import { useInfiniteScroll } from "~core/components/hooks/useInfiniteScroll"
import { Logo } from "~core/components/pure/Logo"
import { Skeleton } from "~core/components/pure/Skeleton"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { Text } from "~core/components/pure/Text"
import type { Origin } from "~core/managers/origin"
import { originManager } from "~core/managers/origin"

import { AppsItem } from "./AppsItem"

export function Apps() {
  const { objects, loading, appendNextPage } = originManager.useObjects(20)
  const [selectedApp, selectApp] = useState<Origin | undefined>()
  const loaderRef = useRef<HTMLDivElement>(null)

  useInfiniteScroll(loaderRef, appendNextPage, objects.length > 0)

  return (
    <div>
      {/* <HorizontalMenu<Filter>
        className="absolute top-0 left-0 right-0"
        items={[
          { label: "My Apps", value: "my-apps" },
          // { label: "Trending", value: "trending" },
          { label: "All (coming soon)", value: "all" }
        ]}
        currentItem={filter}
        onItemSelect={(f) => setFilter(f)}
      /> */}

      {/* <div className="mb-8" /> */}

      {objects.map((origin: Origin) => (
        <AppsRow
          key={origin.id}
          origin={origin}
          onSelect={() => selectApp(origin)}
        />
      ))}

      {objects.length === 0 && !loading && <NoActivity />}

      <div ref={loaderRef}>{loading && <Skeleton />}</div>

      <SlidingPane shown={!!selectedApp} onHide={() => selectApp(undefined)}>
        {selectedApp && <AppsItem origin={selectedApp} />}
      </SlidingPane>
    </div>
  )
}

function AppsRow({
  origin,
  onSelect
}: {
  origin: Origin
  onSelect: () => void
}) {
  return (
    <div
      className={`p-2 h-[4rem] grid grid-cols-7 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700`}
      onClick={onSelect}>
      <Logo
        className="self-start mx-2 my-1 w-5 rounded-full"
        faviconFor={origin.domain}
      />
      <div className="col-span-6">
        <Text truncate>{originManager.originDisplay(origin)}</Text>
        <Text lines={2} size="xs" dimming="less">
          {origin.title} {originManager.url(origin)}
        </Text>
      </div>
    </div>
  )
}
