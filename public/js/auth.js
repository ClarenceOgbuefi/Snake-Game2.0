// Login functionality
function handleLogin() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log("🔹 Server Response:", data); // Add this line to debug
        if (data.success) {
            alert("Login successful! Redirecting...");
            window.location.href = "/"; // Redirect to home page
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error("Error:", error));
}

// Register a new user
function handleRegister() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Registration successful! Please log in.");
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error("Error:", error));
}

// Redirect to home page
function goHome() {
    window.location.href = "/";
}