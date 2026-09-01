import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface OwnerThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const OwnerThemeContext = createContext<OwnerThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

const applyThemeToDOM = (theme: Theme) => {
  if (theme === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
};

export const OwnerThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("owner_theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    applyThemeToDOM(theme);
    return () => {
      document.documentElement.classList.remove("light");
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("owner_theme", next);
      return next;
    });
  };

  return (
    <OwnerThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </OwnerThemeContext.Provider>
  );
};

export const useOwnerTheme = () => useContext(OwnerThemeContext);
