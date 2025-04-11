import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./fonts.css";

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
