import { useEffect, useState } from "react";
import ChatSidebar from "./components/ChatSidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import { useChatSession } from "./hooks/useChatSession.js";

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("flowise_theme") || "dark"
  );

  const {
    models,
    selectedModelId,
    setSelectedModelId,
    mode,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    message,
    setMessage,
    isStreaming,
    handleNewChat,
    handleClearHistory,
    handleModeChange,
    handleSend,
    historyList,
    MODES,
    ACTIVITY_LABELS
  } = useChatSession();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("flowise_theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 light:bg-slate-100 light:text-slate-900">
      <div className="flex min-h-screen">
        <ChatSidebar
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          mode={mode}
          modes={MODES}
          onModeChange={handleModeChange}
          onNewChat={handleNewChat}
          onClearHistory={handleClearHistory}
          historyList={historyList}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
        />
        <ChatArea
          activeSession={activeSession}
          isStreaming={isStreaming}
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
          onSelectFollowUp={setMessage}
          activityLabels={ACTIVITY_LABELS}
        />
      </div>
    </div>
  );
}
