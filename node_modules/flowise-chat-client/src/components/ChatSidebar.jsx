export default function ChatSidebar({
  models,
  selectedModelId,
  onSelectModel,
  mode,
  modes,
  onModeChange,
  onNewChat,
  onClearHistory,
  historyList,
  activeSessionId,
  onSelectSession,
  theme,
  onToggleTheme
}) {
  return (
    <aside className="w-full max-w-xs border-r border-slate-800/60 bg-slate-950/60 light:bg-white/70 light:border-slate-200 p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Flowise Chat</h1>
        <button
          onClick={onToggleTheme}
          className="rounded-full border border-slate-700/60 light:border-slate-300 px-3 py-1 text-xs font-medium"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-col gap-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          Model
        </div>
        <select
          value={selectedModelId}
          onChange={(event) => onSelectModel(event.target.value)}
          className="rounded-xl border border-slate-800/70 light:border-slate-200 bg-slate-900/80 light:bg-white px-3 py-2 text-sm"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-col gap-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          Mode
        </div>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                mode === item.id
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-800/60 light:bg-slate-200 text-slate-200 light:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="flex-1 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white"
        >
          New chat
        </button>
        <button
          onClick={onClearHistory}
          className="flex-1 rounded-xl border border-slate-700/60 light:border-slate-300 px-3 py-2 text-xs font-semibold"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Chat history
        </div>
        <div className="flex flex-col gap-2">
          {historyList.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`rounded-xl px-3 py-2 text-left text-sm ${
                session.id === activeSessionId
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-900/60 light:bg-white"
              }`}
            >
              <div className="font-medium">{session.title}</div>
              <div className="text-xs text-slate-300 light:text-slate-500">
                {session.mode === "research" ? "Research" : "Chat"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
