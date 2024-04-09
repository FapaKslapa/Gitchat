const username = document.getElementById("username");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const email = document.getElementById("email");
const button = document.getElementById("registra");
const buttonGithub = document.getElementById("accediGithub");
const errore = document.getElementById("errore");
const change = document.getElementById("change");
const image = document.getElementById("image");
const change2 = document.getElementById("change2");
const image2 = document.getElementById("image2");
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

buttonGithub.onclick = () => {
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
                    fetch("/github/connect/" + username.value, {method: 'GET'})
                        .then(response => response.json())
                        .then(data => {
                            window.location.href = data.url;
                        })
                        .catch(error => console.error('Error:', error));
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
}


change.onclick = () => {
    if (password.type === "password") {
        password.type = "text";
        image.innerText = "visibility_off";
    } else {
        password.type = "password";
        image.innerText = "visibility";
    }
};

change2.onclick = () => {
    if (confirmPassword.type === "password") {
        confirmPassword.type = "text";
        image2.innerText = "visibility_off";
    } else {
        confirmPassword.type = "password";
        image2.innerText = "visibility";
    }
};