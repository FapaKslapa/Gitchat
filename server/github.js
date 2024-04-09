import path from "path";
import { getUserToken } from "./database.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Octokit, App } = require("octokit");

//{ name: name, descr: descr, homepage: homepage }
export const createRepo = async (token, repoSpecs) => {
  const octokit = new Octokit({ auth: token });
  console.log("token: "+token)
  try {
    const githubResponse = await octokit.request("POST /user/repos", {
      name: repoSpecs.name,
      description: repoSpecs.descr,
      //homepage: repoSpecs.homepage,
      is_template: false,
      Headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    console.log(githubResponse.data.error);
    if (githubResponse.status == 201) {
      return { message: "Repository created successfully" };
    } else {
      throw Error({ message: "Something went wrong" });
    }
  } catch (error) {
    console.log(error);
  }
};

export const acceptInviteToRepo = async (token, invitationId) => {
  try {
    const octokit = new Octokit({
      auth: token,
    });

    const githubResponse = await octokit.request(
      `PATCH /user/repository_invitations/{invitation_id}`,
      {
        invitation_id: invitationId,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    console.log("githubResponse");
    console.log(githubResponse);
  } catch (error) {
    console.log(error);
  }
};

export const sendInvite = async (token, owner, repo, user) => {
  try {
    const octokit = new Octokit({
      auth: token,
    });

    const githubResponse = await octokit.request(
      "PUT /repos/{owner}/{repo}/collaborators/{username}",
      {
        owner: owner,
        repo: repo,
        username: user,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    console.log(githubResponse);
  } catch (error) {
    console.log(error);
  }
};

export const getFiles = async (token, owner, repo, path) => {
  const octokit = new Octokit({ auth: token });
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
        accept: "application/vnd.github+json",
      },
    });
    console.log(githubResponse)
    return githubResponse.data;
  } catch (error) {
    throw error;
  }
};

export const createCodespace = async (token, owner, repo) => {
  try {
    const octokit = new Octokit({ auth: token });
    const githubResponse = await octokit.request(
      `POST /repos/{owner}/{repo}/codespaces`,
      {
        owner: owner,
        repo: repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    console.log(githubResponse);
  } catch (error) {
    console.log(error);
  }
};
