import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

import ProductoPage from './pages/Producto';
import ClientePage from './pages/ClientePage';
import './App.css';

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

import {MdHome, MdInventory, MdPointOfSale} from 'react-icons/md';


//header

const Header = () => {

  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {

    logout();

    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900 text-white h-16 px-4 flex items-center justify-between z-50 shadow-lg">

      
      <div className="flex items-center gap-3">

        <div className="bg-white p-1 rounded-lg shadow-sm flex items-center justify-center w-12 h-12">

          <img
            src="/logoo.png"
            alt="Logo El Márquez"
            className="w-full h-full object-cover"
          />

        </div>

        <div>

          <h1 className="text-sm font-bold leading-tight uppercase tracking-tight">
            Mueblería
          </h1>

          <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">
            El Márquez
          </p>

        </div>

      </div>


      
      <div className="flex items-center gap-3">

        <div className="hidden sm:block text-right">

          <p className="text-xs font-semibold text-white">
            {usuario?.nombre_completo || 'Usuario'}
          </p>

          <p className="text-[10px] text-slate-400 uppercase">
            {usuario?.rol || 'ADMIN'}
          </p>

        </div>


        
        <div className="h-9 w-9 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">

          <span className="text-xs font-bold text-slate-300">
            {usuario?.nombre_usuario?.substring(0, 2).toUpperCase() || 'US'}
          </span>

        </div>


       
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="h-9 w-9 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
            />

          </svg>

        </button>

      </div>

    </header>
  );
};


//footer

const MobileFooter = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      label: 'Inicio',
      icon: MdHome
    },
    {
      path: '/productos',
      label: 'Muebles',
      icon: MdInventory
    },
    {
      path: '/clientes',
      label: 'Vender',
      icon: MdPointOfSale
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50">

      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-all relative ${
              isActive
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >

            <Icon
              size={24}
              className="transition-transform"
            />

            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">
              {item.label}
            </span>

            {isActive && (
              <div className="absolute bottom-0 w-8 h-1 bg-indigo-600 rounded-t-full" />
            )}

          </Link>
        );
      })}

    </nav>
  );
};


//pagina inico  

const Inicio = () => (

  <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">

    <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">

      Bienvenido a <br />

      <span className="text-indigo-600">
        El Márquez
      </span>

    </h1>

    <p className="text-slate-500 text-lg mb-8">
      Gestión de inventario y ventas al por mayor y menor.
    </p>

    <Link
      to="/clientes"
      className="w-full max-w-xs bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"
    >
      INICIAR VENTA
    </Link>

  </div>

);


//contenido de la app

function AppContent() {

  const location = useLocation();

  // Detectamos si estamos en Login
  const isLogin = location.pathname === '/login';

  return (

    <div className="min-h-screen bg-slate-50 flex flex-col">

      {!isLogin && <Header />}

      <main
        className={
          isLogin
            ? "flex-1"
            : "flex-1 pt-20 pb-24"
        }
      >

        <Routes>

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/"
            element={

              <ProtectedRoute>

                <Inicio />

              </ProtectedRoute>

            }
          />

          <Route
            path="/productos"
            element={

              <ProtectedRoute>

                <ProductoPage />

              </ProtectedRoute>

            }
          />
          <Route
            path="/clientes"
            element={

              <ProtectedRoute>

                <ClientePage />

              </ProtectedRoute>

            }
          />

          <Route
            path="*"
            element={

              <ProtectedRoute>

                <div className="text-center mt-20 px-6">

                  <h2 className="text-2xl font-bold text-slate-900">
                    Página no encontrada
                  </h2>

                  <Link
                    to="/"
                    className="text-indigo-600 font-bold mt-4 inline-block"
                  >
                    Volver al Inicio
                  </Link>

                </div>

              </ProtectedRoute>

            }
          />

        </Routes>

      </main>

      {!isLogin && <MobileFooter />}

    </div>

  );
}


function App() {

  return (

    <AuthProvider>

      <Router>

        <AppContent />

      </Router>

    </AuthProvider>

  );
}


export default App;