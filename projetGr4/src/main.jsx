import React from "react";
import { createRoot } from "react-dom/client";
import "./css/home.css";

function App() {

  const goTo = (page) => {
    let target = "";

    if (page === "editor") {
      target = "src/html/editor.html";
    } else if (page === "arbre") {
      target = "src/html/arbre.html";
    } else if (page === "documentation") {
      target = "./docs/index.html";
    }
  
    window.location.href = `${import.meta.env.BASE_URL}${target}`;
  };

return (
  <div className="home">
    <header className="home-signature">
    </header>

    <main className="home-center">
      <h1 className="home-title">SlideLab</h1>
      <p className="home-subtitle">
        Créez, structurez et donnez vie à vos idées visuelles
      </p>
    </main>

    <div className="home-actions">
      <button className="home-btn primary" onClick={() => goTo("editor")}>
        Ouvrir l’éditeur
      </button>
      <button className="home-btn secondary" onClick={() => goTo("arbre")}>
        Voir l’arbre
      </button>
    </div>

    <footer className="home-quote" onClick={() => goTo("documentation")}>
      <a class="doc-link">DOCUMENTATION</a>
    </footer>
  </div>
);
}

createRoot(document.getElementById("root")).render(<App />);