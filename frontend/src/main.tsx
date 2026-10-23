import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "@/components/ui/toast"
import "@/lib/socket"

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
    <Toaster> 
      <App />
      </Toaster>
    </BrowserRouter>
);
