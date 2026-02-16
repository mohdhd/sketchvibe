import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SettingsModal from './components/SettingsModal';
import CanvasStudio from './components/canvas/CanvasStudio';
import CanvasLibrary from './components/canvas/CanvasLibrary';
import TipPrompt, { shouldShowTip, incrementTipCounter } from './components/TipPrompt';
import LandingPage from './components/LandingPage';

function ChatApp() {
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
    <div className="h-full flex overflow-hidden">
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

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<ChatApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
