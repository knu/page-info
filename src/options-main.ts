import { StrictMode, createElement } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { PageInfoOptions } from "./options.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  createElement(StrictMode, null, createElement(PageInfoOptions)),
);
