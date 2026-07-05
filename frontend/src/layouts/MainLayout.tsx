import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

function MainLayout() {
  return (
    <div>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
