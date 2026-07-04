const routes = {
    404: "404.html",
    "": "home.html",
    "#": "home.html",
    "#home": "home.html",
    "#basicStructure": "basicStructure.html",
    "#codeHelp": "codeHelp.html",
    "#products": "products.html",
};

const handleLocation = async () => {
    let path = window.location.hash;
    if (path.length === 0) { path = "#home"; }
    const route = routes[path] || routes[404];

    try {
        const response = await fetch(route);

        if (!response.ok) throw new Error("File not found");
        const html = await response.text();
        document.getElementById("mainbody").innerHTML = html;

        // Execute view-specific logic
        if (path === "#home" || path === "" || path === "#") {
            if (typeof renderHome === "function") {
                renderHome();
            }
        }
    } catch (e) {
        document.getElementById("mainbody").innerHTML = `
        <h1 >Error 404 :: page not found ${e}</h1>
        `;
    }
}

window.addEventListener("hashchange", handleLocation);

handleLocation();

