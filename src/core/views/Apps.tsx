export function Apps() {
  return (
    <div className="flex-auto">
      <div className="flex flex-row flex-wrap justify-center">
        <div className="w-1/2 p-2">
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
            <div className="flex flex-row">
              <div className="flex-none">
                <img
                  className="w-12 h-12 rounded-full"
                  src="https://avatars.githubusercontent.com/u/10660468?s=460&u=3b2a3c2d4b0b0f9c8c8b0b8b8b8b8b8b8b8b8b8b&v=4"
                  alt="avatar"
                />
              </div>
              <div className="flex-auto pl-4">
                <div className="text-lg font-semibold">Dapplets</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  dapplets
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
