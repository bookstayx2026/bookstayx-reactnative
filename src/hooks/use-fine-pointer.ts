import { useEffect, useState } from "react";
import { Platform } from "react-native";

const FOCUS_RING_CSS = `
[data-focus-ring="true"]:focus { outline: none; }
[data-focus-ring="true"]:focus-visible {
  outline: 2px solid #E0B84A;
  outline-offset: 3px;
}
`;

export function installFocusRing() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.querySelector("[data-bookstayx-focus-ring]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-bookstayx-focus-ring", "true");
  style.textContent = FOCUS_RING_CSS;
  document.head.appendChild(style);
}

export function focusRingProps(extra?: object) {
  if (Platform.OS !== "web") return {};
  return { dataSet: { focusRing: "true" }, ...extra };
}

export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    installFocusRing();
    if (Platform.OS !== "web" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return fine;
}
