async function fetchLeaderboard(mode) {
    let res = await fetch("/leaderboard");
    let data = await res.json();
    let leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = data[mode].map(player => `<li>${player.username}: ${player.score}</li>`).join("");
}