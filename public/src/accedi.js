const username = document.getElementById("username");
const password = document.getElementById("password");
const button = document.getElementById("accedi");

button.onclick = () => {
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value,
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            if (data.login) {
                console.log("entrato");
                sessionStorage.setItem("username", username.value);
                sessionStorage.setItem("password", password.value);
                window.location.href = "/index.html";
            } else {
                alert("Username o password errati");
            }
        });
};
