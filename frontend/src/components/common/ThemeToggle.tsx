"use client";

import { useSyncExternalStore } from "react";
import { THEME_TOGGLE } from "@/src/constants/shared/common";

type Theme = "light" | "dark";

const STORAGE_KEY = "infinity-theme";
const THEME_EVENT = "infinity-theme-change";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => "light");

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " is-compact" : ""}`}
      aria-label={isDark ? THEME_TOGGLE.toLight : THEME_TOGGLE.toDark}
      aria-pressed={isDark}
      title={isDark ? THEME_TOGGLE.usingDark : THEME_TOGGLE.usingLight}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-sun">☀</span>
        <span className="theme-toggle-moon">☾</span>
        <i />
      </span>
      {!compact && <span className="theme-toggle-label">{isDark ? THEME_TOGGLE.dark : THEME_TOGGLE.light}</span>}
    </button>
  );
}

function subscribeToTheme(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || (event.newValue !== "light" && event.newValue !== "dark")) return;
    applyTheme(event.newValue);
    onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = theme === "dark" ? "#08111f" : "#ffffff";
  });
}
