import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusPage from "./page";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Header />
    <div className="flex-1">
      <StatusPage />
    </div>
    <Footer />
  </StrictMode>,
);
