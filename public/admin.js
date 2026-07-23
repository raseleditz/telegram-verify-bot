const API = "";

async function loadUsers() {

    const res = await fetch(API + "/admin/users");
    const users = await res.json();

    const tbody = document.getElementById("users");

    tbody.innerHTML = "";

    users.forEach(user => {

        tbody.innerHTML += `
        <tr>
            <td>${user.telegramUserId}</td>
            <td>${user.firstName || ""} ${user.lastName || ""}</td>
            <td>@${user.username || "-"}</td>
            <td>
                <span class="${user.plan === "premium" ? "premium" : "free"}">
                    ${user.plan}
                </span>
            </td>
            <td>
                <button onclick="setPlan('${user.telegramUserId}','premium')">
                    Premium
                </button>

                <button onclick="setPlan('${user.telegramUserId}','free')">
                    Free
                </button>
            </td>
        </tr>
        `;

    });

}

async function setPlan(id, plan) {

    const res = await fetch(API + "/admin/set-plan", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            id,
            plan
        })

    });

    const data = await res.json();

    alert(data.message);

    loadUsers();

}

loadUsers();
