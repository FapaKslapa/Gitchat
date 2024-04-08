import { Ockokit, app } from "ocktokit";
import { getUserToken } from "./database";



export const createRepo = async (user, token) => {
  const ocktokit = new Ockokit({ auth: token });
  try {
    const githubResponse = await ocktokit.request('POST /user/repos', {
        name: 
    });
  } catch (error) {}
};

const acceptInviteToRepo = () => {};

const sendInvite = (repo, user) => {};
