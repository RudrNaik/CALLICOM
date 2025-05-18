import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import './assets/css/geist_mono.css';
// To use: style={{ fontFamily: 'Geist_Mono' }} in the style component of every div, NOT THE CLASSNAME!

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
