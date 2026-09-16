import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);
const THEME_KEY = "richfieldConnectTheme";

function ThemeProvider({ children }) {
  // Lazy initialiser — reads localStorage synchronously before first paint,
  // so there's no flash of the wrong theme on load. (AppContext hydrates
  // user/posts via useEffect instead, because that only needs to finish
  // before Profile/Feed render — this needs to finish before ANYTHING
  // renders, since it affects every pixel on screen immediately.)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || "light";
  });

  // The actual side effect: dark-mode CSS variable overrides live under a
  // `.dark` class on <body> in index.css, so React has to reach outside its
  // own component tree to apply it — a textbook useEffect use case (Ch 7.3).
  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a <ThemeProvider>");
  }
  return context;
}

export { ThemeProvider, useTheme };
