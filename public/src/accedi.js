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


document.addEventListener("DOMContentLoaded", function () {
    gsap.to("#animatedCircle", {
        x: "100vw", // Muovi il cerchio fino al bordo destro della finestra
        repeat: -1, // Ripeti all'infinito
        yoyo: true, // Vai avanti e indietro
        duration: 2, // Durata di ogni ciclo di animazione
        ease: "power1.inOut" // Easing per un movimento più fluido
    });
});

document.getElementById('accediGithub').addEventListener('click', function () {
    // Invia una richiesta al server per iniziare il flusso di autorizzazione OAuth
    fetch('/github/login', {method: 'GET'})
        .then(response => response.json())
        .then(data => {
            window.location.href = data.url;
        })
        .catch(error => console.error('Error:', error));
});