import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { Templates } from '@/pages/Templates';
import { Editor } from '@/pages/Editor';
import { Settings } from '@/pages/Settings';
import { AssistantPage } from '@/pages/Assistant';
import { Recent } from '@/pages/Recent';

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/app"
            element={<AppShell />}
          >
            <Route index element={<Page><Dashboard /></Page>} />
            <Route path="projects" element={<Page><Projects /></Page>} />
            <Route path="templates" element={<Page><Templates /></Page>} />
            <Route path="assistant" element={<Page><AssistantPage /></Page>} />
            <Route path="recent" element={<Page><Recent /></Page>} />
            <Route path="settings" element={<Page><Settings /></Page>} />
          </Route>
          <Route path="/app/editor/:projectId" element={<Editor />} />
          <Route path="/app/editor" element={<Navigate to="/app/editor/new" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}