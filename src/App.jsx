import { lazy, Suspense } from 'react';
import MenuBook from './pages/MenuBook.jsx';

// The admin screen is a separate download, so menu visitors never load it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function isAdminRoute() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = window.location.pathname.slice(base.length);
  return /^\/admin\/?$/.test(path) || window.location.hash === '#/admin';
}

// The QR code opens the menu book. /admin opens the menu editor (password protected).
export default function App() {
  if (isAdminRoute()) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }
  return <MenuBook />;
}
