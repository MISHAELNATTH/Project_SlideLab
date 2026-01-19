import React from "react";
import { createRoot } from "react-dom/client";

function App() {
    
    const goTo = (page) => {
        let target = "";

        if (page === "editor") {
            target = "src/html/editor.html";
        } else if (page === "arbre") {
            target = "src/html/arbre.html";
        } else {
            target = ""; // accueil
        }

        window.location.href = `${import.meta.env.BASE_URL}${target}`;
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>Accueil React</h1>

            <button onClick={() => goTo("editor")}>Aller à editor</button>
            <br />
            <button onClick={() => goTo("arbre")}>Aller à l'arbre</button>
        </div>
    );
}

createRoot(document.getElementById("root")).render(<App />);