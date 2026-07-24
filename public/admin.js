const API = "";

const card = document.getElementById("card");

const photo = document.getElementById("photo");
const nameEl = document.getElementById("name");
const usernameEl = document.getElementById("username");
const tgidEl = document.getElementById("tgid");
const planEl = document.getElementById("plan");
const expireEl = document.getElementById("expire");
const remainingEl = document.getElementById("remaining");

const totalUsers = document.getElementById("totalUsers");
const premiumUsers = document.getElementById("premiumUsers");
const freeUsers = document.getElementById("freeUsers");

const searchBtn = document.getElementById("search");
const userInput = document.getElementById("userid");

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});

let currentUser = null;

searchBtn.onclick = async () => {

    const id = userInput.value.trim();

    if (!id) {
        alert("Enter Telegram ID");
        return;
    }

    const res = await fetch(API + "/admin/users");
    const users = await res.json();
    
    totalUsers.innerText = users.length;

premiumUsers.innerText =
    users.filter(x => x.plan === "premium").length;

freeUsers.innerText =
    users.filter(x => x.plan !== "premium").length;

    const user = users.find(x => x.telegramUserId == id);

    if (!user) {
        alert("User not found");
        card.classList.add("hidden");
        return;
    }

    currentUser = user;

    card.classList.remove("hidden");

    nameEl.innerText =
        `${user.firstName || ""} ${user.lastName || ""}`;

    usernameEl.innerText =
        user.username
            ? "@" + user.username
            : "No Username";

    tgidEl.innerText = user.telegramUserId;

    planEl.innerText =
    user.plan === "premium"
        ? "👑 Premium Plan"
        : "Free Plan";

if (user.premiumUntil) {

    const expireDate = new Date(user.premiumUntil);

    expireEl.innerText =
        "Premium Until : " +
        expireDate.toLocaleDateString();

    const diff =
        expireDate - new Date();

    const days =
        Math.ceil(diff / (1000 * 60 * 60 * 24));

    remainingEl.innerText =
        "Remaining : " +
        (days > 0 ? days : 0) +
        " Days";

} else {

    expireEl.innerText =
        "Premium Until : -";

    remainingEl.innerText =
        "Remaining : -";

}

if (user.photoUrl) {
    photo.src = user.photoUrl;
} else {
    photo.src = "https://i.imgur.com/6VBx3io.png";
}

};

async function changePlan(plan, days = 0) {

    if (!currentUser) return;

    const res = await fetch(API + "/admin/set-plan", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            id: currentUser.telegramUserId,
            plan,
            days

        })

    });

    const data = await res.json();

    alert(data.message);

    searchBtn.click();

}

document
.getElementById("premium30")
.onclick = () => changePlan("premium",30);

document
.getElementById("premium90")
.onclick = () => changePlan("premium",90);

document
.getElementById("remove")
.onclick = () => changePlan("free",0);