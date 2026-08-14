import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext';
import { SessionProvider } from './context/SessionContext';
import Landing from './pages/Landing';
import BodyInfo from './pages/BodyInfo';
import PhotoUpload from './pages/PhotoUpload';
import Result from './pages/Result';

export default function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/input" element={<BodyInfo />} />
            <Route path="/upload" element={<PhotoUpload />} />
            <Route path="/result" element={<Result />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
