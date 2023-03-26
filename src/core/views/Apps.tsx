import { useRef } from "react"

import { useInfiniteScroll } from "~core/components/hooks/useInfiniteScroll"
import { Logo } from "~core/components/pure/Logo"
import { Skeleton } from "~core/components/pure/Skeleton"
import { Origin, originManager } from "~core/managers/origin"

export function Apps() {
  const { objects, loading, appendNextPage } = originManager.useObjects(20)

  const loaderRef = useRef<HTMLDivElement>(null)

  useInfiniteScroll(loaderRef, appendNextPage, objects.length > 0)

  return (
    <div>
      {objects.map((origin: Origin) => (
        <AppsRow
          key={origin.id}
          origin={origin}
          onSelect={() => window.open(originManager.url(origin), "_blank")}
        />
      ))}

      <div ref={loaderRef}>{loading && <Skeleton />}</div>
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
        <div className="overflow-hidden truncate">
          {originManager.originDisplay(origin)}
        </div>
        <div className="line-clamp-2 text-xs text-slate-600 dark:text-slate-500">
          {origin.title} {originManager.url(origin)}
        </div>
      </div>
    </div>
  )
}

// export function Apps() {
//   return (
//     <div className="flex-auto">
//       <div className="flex flex-row flex-wrap justify-center">
//         <div className="w-1/2 p-2">
//           <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
//             <div className="flex flex-row">
//               <div className="flex-none">
//                 <img
//                   className="w-12 h-12 rounded-full"
//                   src="https://avatars.githubusercontent.com/u/10660468?s=460&u=3b2a3c2d4b0b0f9c8c8b0b8b8b8b8b8b8b8b8b8b&v=4"
//                   alt="avatar"
//                 />
//               </div>
//               <div className="flex-auto pl-4">
//                 <div className="text-lg font-semibold">Dapplets</div>
//                 <div className="text-sm text-slate-500 dark:text-slate-400">
//                   dapplets
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
