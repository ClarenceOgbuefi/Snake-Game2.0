// Init leaderboard
async function fetchLeaderboard(mode) {
    try {
        let res = await fetch("/leaderboard");
        let data = await res.json();
        
        let leaderboardList = document.getElementById("leaderboardList");
        leaderboardList.innerHTML = data[mode]
            .map(player => `<li>${player.username}: ${player[mode === "regular" ? "regular_score" : "timed_score"]}</li>`)
            .join("");
    } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
    }
}