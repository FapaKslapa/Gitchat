const username = document.getElementById("username");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const email = document.getElementById("email");
const button = document.getElementById("crea");
const errore = document.getElementById("errore");

button.onclick = () => {
    if (password.value === confirmPassword.value) {
        fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                mail: email.value,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.message === 'Registration successful') {
                    window.location.href = "./index.html";
                } else if (data.message === "All fields must be provided") {
                    console.log("All fields must be provided");
                    errore.className = "alert alert-danger" // remove 'invisible' class
                    errore.textContent = "Tutti i campi devono essere compilati"; // set the error message
                } else if (data.message === "Mail già in uso") {
                    errore.className = "alert alert-danger"; // remove 'invisible' class
                    errore.textContent = "Username già in uso"; // set the error message
                } else if (data.message === "Username già in uso") {
                    errore.className = "alert alert-danger"; // remove 'invisible' class
                    errore.textContent = "Username già in uso"; // set the error message
                }
            });
    } else {
        errore.classList.remove("invisible") // remove 'invisible' class
        errore.innerText = "Le password non coincidono"; // set the error message
    }
};