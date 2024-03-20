const templateMessageMio = `
<li class="d-flex justify-content-start mb-4">
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="60" style="margin-right: 10px;">
    <div class="card mask-custom" style="width: fit-content; max-width: 50%;">
        <div class="card-header d-flex justify-content-between p-3 align-items-center"
             style="border-bottom: 1px solid rgba(255,255,255,.3);">
            <p class="fw-bold mb-0" style="margin-right: 10px;">%USERNAME</p>
            <p class=" small mb-0"><i class="far fa-clock"></i>%TEMPO</p>
        </div>
        <div class="card-body">
            <p class="mb-0">
                %TESTO
            </p>
        </div>
    </div>
</li>`;
const templateMessageAltro = `
<li class="d-flex justify-content-end mb-4">
    <div class="card mask-custom" style="width: fit-content; max-width: 50%;">
        <div class="card-header d-flex justify-content-between p-3 align-items-center"
             style="border-bottom: 1px solid rgba(255,255,255,.3);">
            <p class="fw-bold mb-0" style="margin-right: 10px;">%USERNAME</p>
            <p class="small mb-0"><i class="far fa-clock"></i> %TEMPO</p>
        </div>
        <div class="card-body">
            <p class="mb-0">
                %TESTO
            </p>
        </div>
    </div>
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60" style="margin-left: 10px;">
</li>`;
export const populateCheckBoxChat = (friends) => {
    checkBoxChat.innerHTML = friends
        .map((friend) => {
            return `<div class="row mt-3 d-flex align-items-center">
                        <div class="col-md-auto">
                            <img src="data:image/jpeg;base64,${friend.fotoProfilo}" alt="avatar"
                                 class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
                        </div>
                        <div class="col-md-auto align-middle">
                            <h3 class="align-middle">${friend.username}</h3>
                        </div>
                        <div class="col-md-auto align-middle">
                            <input type="checkbox" class="btn-check" id="createChat_${friend.username}" value="${friend.username}" autocomplete="off">
                            <label class="btn btn-outline-primary" for="createChat_${friend.username}">Seleziona</label>
                        </div>
                    </div>`;
        })
        .join("");
}
