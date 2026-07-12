import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <p>EduCloud Lite - Cloud-Based Learning Management Platform on AWS.</p>
        <p>Built for Application Development on AWS.</p>
      </footer>
    </div>
  );
}

export default MainLayout;
