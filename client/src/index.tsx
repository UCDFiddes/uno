import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Main react method that turns the code into html and renders it in the template html.
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
