import axios, { AxiosResponse } from "axios";

const clientId = "ffd2b6481cb84901932381a5ba9e8554";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
  redirectToAuthCodeFlow(clientId);
} else {
  getAccessToken(clientId, code).then((accessToken: string) => {
    fetchProfile(accessToken).then((profile: any) => {
      populateUI(profile);
    });
  });
}

async function redirectToAuthCodeFlow(clientId: string) {
  const verifier: string = generateCodeVerifier(128);
  const challenge: string = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function getAccessToken(clientId: string, code: string): Promise<string> {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("code_verifier", verifier!);

  const response: AxiosResponse = await axios.post(
    "https://accounts.spotify.com/api/token",
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

function generateCodeVerifier(length: number): string {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest) as any))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function fetchProfile(accessToken: string): Promise<any> {
  const response: AxiosResponse = await axios.get(
    "https://api.spotify.com/v1/me",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data;
}

function populateUI(profile: any) {
  document.getElementById("displayName")!.innerText = profile.display_name;
  document.getElementById("avatar")!.setAttribute("src", profile.images[0].url);
  document.getElementById("id")!.innerText = profile.id;
  document.getElementById("email")!.innerText = profile.email;
  document.getElementById("uri")!.innerText = profile.uri;
  document
    .getElementById("uri")!
    .setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url")!.innerText = profile.href;
  document.getElementById("url")!.setAttribute("href", profile.href);
  document.getElementById("imgUrl")!.innerText = profile.images[0].url;
}
