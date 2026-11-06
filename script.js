const API_URL = "https://phi-lab-server.vercel.app/api/v1/lab";

const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const dashboard = document.getElementById("dashboard");

const issueGrid = document.getElementById("issue-grid");
const issueCount = document.getElementById("issue-count");
const cardTemplate = document.getElementById("issue-card-template");
const listLoading = document.getElementById("list-loading");
const listFeedback = document.getElementById("list-feedback");
const listMessage = document.getElementById("list-message");
const retryButton = document.getElementById("retry-button");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-button");

let currentIssues = [];
let activeStatus = "all";
let activeSearch = "";
let issuesLoaded = false;
let lastListRequest = 0;
let lastDetailRequest = 0;
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "admin123") {
        loginError.hidden = true;
        loginScreen.hidden = true;
        dashboard.hidden = false;
        window.scrollTo(0, 0);
        loadIssues();
    } else {
        loginError.hidden = false;
    }
});

async function fetchData(path) {
    const response = await fetch(API_URL + path);

    if (!response.ok) {
        throw new Error("The server could not return issues.");
    }

    const result = await response.json();
    return result.data;
}