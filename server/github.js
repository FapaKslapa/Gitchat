import path from "path";
import {getUserToken} from "./database.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const {Octokit, App} = require("octokit");

//{ name: name, descr: descr, homepage: homepage }
/**
 * Funzione che crea una repository su GH
 * @param {string} token - Il token di un utente per accedere all'API di GH
 * @param {Object} repoSpecs - Un oggetto che contiene le specifiche per l'inizializzazione di una repository
 * @returns L'ID della repository
 */
export const createRepo = async (token, repoSpecs) => {
    const octokit = new Octokit({auth: token});
    try {
        console.log("descr: " + repoSpecs.descr);
        const githubResponse = await octokit.request("POST /user/repos", {
            name: repoSpecs.name,
            description: repoSpecs.descr,
            private: repoSpecs.private,
            auto_init: true,
            is_template: false,
            Headers: {
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
        console.log(githubResponse);
        if (githubResponse.status == 201) {
            return {
                message: "Repository created successfully",
                fullname: githubResponse.data.full_name
            };
        } else {
            throw Error({message: "Something went wrong"});
        }
    } catch (error) {
        console.log(error);
    }
};

/**
 * Funzione che accetta un invito ad una repository
 * @param {string} token - Il token di un utente per accedere all'API di GH
 * @param {*} invitationId - L'ID dell'invito da accettare
 */
export const acceptInviteToRepo = async (token, invitationId) => {
    try {
        const octokit = new Octokit({
            auth: token
        });
        console.log("token: " + token);
        console.log("invitation id: " + invitationId);
        const githubResponse = await octokit.request(
            `PATCH /user/repository_invitations/{invitation_id}`,
            {
                invitation_id: invitationId,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            }
        );
        console.log("githubResponse");
        console.log(githubResponse);
    } catch (error) {
        console.log(error);
    }
};

/**
 * Funzione che manda un invito ad una repository ad un altro utente
 * @param {string} token - Il token di un utente per accedere all'API di GH
 * @param {string} owner - Lo username del proprietario della repository
 * @param {string} repo - Il nome della repository
 * @param {string} user - Lo username dell'utenete a cui mandare l'invito
 * @returns la conferma dell'API
 */
export const sendInvite = async (token, owner, repo, user) => {
    try {
        const octokit = new Octokit({
            auth: token
        });

        const githubResponse = await octokit.request(
            "PUT /repos/{owner}/{repo}/collaborators/{username}",
            {
                owner: owner,
                repo: repo,
                username: user,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            }
        );
        return githubResponse;
    } catch (error) {
        console.log(error);
    }
};

export const getFiles = async (token, owner, repo, path) => {
    const octokit = new Octokit({auth: token});
    try {
        let url = `GET /repos/{owner}/{repo}/contents/{path}`;
        /*if(path == undefined){
          url = `GET /repos/{owner}/{repo}/contents`;
        }else{
          url = `GET /repos/{owner}/{repo}/contents/{path}`;
        }*/
        const githubResponse = await octokit.request(url, {
            owner: owner,
            repo: repo,
            path: path,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
                accept: "application/vnd.github+json"
            }
        });
        return githubResponse.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Funzione che crea un codespace nella repository
 * @param {string} token - Il token di un utente per accedere all'API di GH
 * @param {string} owner - Lo username del proprietario della repository
 * @param {string} repo - Il nome della repository
 * @returns la conferma dell'API
 */
export const createCodespace = async (token, owner, repo) => {
    try {
        const octokit = new Octokit({auth: token});
        const githubResponse = await octokit.request(
            `POST /repos/{owner}/{repo}/codespaces`,
            {
                owner: owner,
                repo: repo,
                ref: "main",
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                }
            }
        );
        //console.log(githubResponse);
        return githubResponse;
    } catch (error) {
        console.log(error);
    }
};

/**
 * Funzione che recupera i codespace presenti in una repository
 * @param {string} token - Il token di un utente per accedere all'API di GH
 * @param {string} owner - Lo username del proprietario della repository
 * @param {string} repo - Il nome della repository
 * @returns La lista dei codespace presenti in quella repository
 */
export const getCodespace = async (token, owner, repo) => {
  try {
    const octokit = new Octokit({ auth: token });
    const githubResponse = await octokit.request(
      `GET /repos/{owner}/{repo}/codespaces`,
      {
        owner: owner,
        repo: repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        }
      }
    );
    //console.log(githubResponse);
    return githubResponse;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Funzione che recupera i nomi dei partecipanti alla repository
 * @param {string} token - Il token di un utente per accedere all'API di GH
 * @param {string} owner - Lo username del proprietario della repository
 * @param {string} repo - Il nome della repository
 * @returns La lista dei paretecipanti alla repository
 */
export const getRepoParticipants = async (token, owner, repo) => {
    try {
        const octokit = new Octokit({auth: token});
        const githubResponse = await octokit.request(
            `GET /repos/{owner}/{repo}/collaborators`,
            {
                owner: owner,
                repo: repo,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            }
        );
        console.log(githubResponse);
        const participants = [];
        githubResponse.data.forEach(element => {
            participants.push(element.login);
        });
        return participants;
    } catch (error) {
        console.log(error);
    }
};
