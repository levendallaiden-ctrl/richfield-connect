import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Toast from "./components/Toast/Toast";
import PageTransition from "./components/PageTransition/PageTransition";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import SignUpForm from "./pages/SignUpForm/SignUpForm";
import SignInForm from "./pages/SignInForm/SignInForm";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Profile from "./pages/Profile/Profile";
import People from "./pages/People/People";
import Feed from "./pages/Feed/Feed";
import Admin from "./pages/Admin/Admin";
import NotFound from "./pages/NotFound/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions/TermsAndConditions";

import styles from "./App.module.css";

// Split out because App itself renders BrowserRouter — useLocation() only
// works in a component that's a DESCENDANT of the router, not the one
// creating it.
function AppLayout() {
  const location = useLocation();

  return (
    <div className={styles.appContainer}>
      <Navbar />
      <main className={styles.mainContent}>
        {/* key={pathname} forces a fresh mount per route, which is what
            makes the entry animation replay on every navigation */}
        <PageTransition key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/signup"
              element={
                <SignedOutOnly>
                  <SignUpForm />
                </SignedOutOnly>
              }
            />
            <Route
              path="/signin"
              element={
                <SignedOutOnly>
                  <SignInForm />
                </SignedOutOnly>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <SignedInOnly>
                  <SignUpForm />
                </SignedInOnly>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:email" element={<Profile />} />
            <Route path="/people" element={<People />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
      <Toast />
    </div>
  );
}

function SignedOutOnly({ children }) {
  const { user } = useApp();

  return user ? <Navigate to="/profile" replace /> : children;
}

function SignedInOnly({ children }) {
  const { user } = useApp();

  return user ? children : <Navigate to="/signin" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;