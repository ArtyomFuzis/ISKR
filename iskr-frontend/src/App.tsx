import {BrowserRouter as Router, Routes, Route, Navigate, useLocation} from 'react-router-dom';
import './App.scss';
import Header from "./components/layout/header/Header.tsx";
import Home from "./components/pages/home/Home.tsx";
import Statistic from "./components/pages/statistic/Statistic.tsx";
import {useSelector} from "react-redux";
import type {RootState} from "./redux/store.ts";
import AdminPage from './components/pages/admin-page/AdminPage.tsx';
import Library from "./components/pages/library/Library.tsx";
import Profile from "./components/pages/profile/Profile.tsx";
import Book from "./components/pages/book/Book.tsx";
import Collection from "./components/pages/collection/Collection.tsx";
import Account from "./components/pages/account/Account.tsx";
import Followers from "./components/pages/followers/Followers.tsx";
import Subscriptions from "./components/pages/subscriptions/Subscriptions.tsx";
import ResetPasswordPage from "./components/pages/reset-password/ResetPasswordPage.tsx";
import { useEffect } from 'react';

// Компонент-обертка для передачи состояния в Header
function AppWrapper() {
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  // Используем location.state для передачи данных между маршрутами
  const showLoginModal = location.state?.showLoginModal || false;

  return (
    <>
      <Header showLoginModal={showLoginModal} />
      <Routes location={location}>
        <Route path="/" element={<Home />}/>
        <Route path="/statistic" element={isAuthenticated ? <Statistic /> : <Navigate to="/" replace />}/>
        <Route path="/library" element={isAuthenticated ? <Library /> : <Navigate to="/" replace /> }/>
        <Route path="/admin" element={user?.username === 'admin' ? <AdminPage /> : <Navigate to="/" replace /> }/>
        <Route path="/profile" element={<Profile />} />
        <Route path="/book" element={<Book />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/account" element={isAuthenticated ? <Account /> : <Navigate to="/" replace /> } />
        <Route path="/followers" element={<Followers />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;