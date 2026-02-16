import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SettingsModal from './components/SettingsModal';
import CanvasStudio from './components/canvas/CanvasStudio';
import CanvasLibrary from './components/canvas/CanvasLibrary';
import TipPrompt, { shouldShowTip, incrementTipCounter } from './components/TipPrompt';

function AppContent() {
  const { activeModal, activeConversationId } = useApp();
  const [showTip, setShowTip] = useState(false);

  // Tip counter — show after every ~3 conversations
  useEffect(() => {
    if (activeConversationId) {
      incrementTipCounter();
      if (shouldShowTip()) {
        setShowTip(true);
      }
    }
  }, [activeConversationId]);

  return (
    <div className="h-full flex">
      <Sidebar />
      <ChatView />

      {/* Modals */}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'canvas-studio' && <CanvasStudio />}
      {activeModal === 'canvas-library' && <CanvasLibrary />}
      {showTip && <TipPrompt onClose={() => setShowTip(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
