import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  const goToEditor = () => {
    const target = import.meta.env.DEV ? "src/html/editor.html" : "src/html/editor.html";

    window.location.href = `${import.meta.env.BASE_URL}${target}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Accueil React</h1>
      <button onClick={goToEditor}>Aller à editor</button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);