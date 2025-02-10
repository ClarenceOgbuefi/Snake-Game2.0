// Save user customization to the server
async function saveCustomization() {
    let snakeColor = document.getElementById("snakeColor").value;
    let mapColor = document.getElementById("mapColor").value;

    await fetch("/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snake_color: snakeColor, map_color: mapColor })
    });
    alert("Customization saved!");
}