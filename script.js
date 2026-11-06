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
async function loadIssues(searchText = "") {
    // Only the latest request should update the issue list.
    const requestNumber = ++lastListRequest;
    activeSearch = searchText;
    issuesLoaded = false;
    issueGrid.hidden = true;
    listFeedback.hidden = true;
    listLoading.hidden = false;

    let path = "/issues";
    if (searchText !== "") {
        path = "/issues/search?q=" + encodeURIComponent(searchText);
    }

    try {
        const issues = await fetchData(path);
        if (requestNumber !== lastListRequest) {
            return;
        }

        currentIssues = issues;
        showIssues();
        issuesLoaded = true;
    } catch {
        if (requestNumber !== lastListRequest) {
            return;
        }

        issueCount.textContent = "0 Issues";
        listMessage.textContent = "Could not load issues. Please try again.";
        retryButton.hidden = false;
        listFeedback.hidden = false;
    } finally {
        if (requestNumber === lastListRequest) {
            listLoading.hidden = true;
        }
    }
}
function showIssues() {
    let issues = currentIssues;

    if (activeStatus !== "all") {
        issues = currentIssues.filter(function (issue) {
            return issue.status === activeStatus;
        });
    }

    issueGrid.textContent = "";
    issueCount.textContent = issues.length + (issues.length === 1 ? " Issue" : " Issues");

    if (issues.length === 0) {
        issueGrid.hidden = true;
        listMessage.textContent = "No issues found.";
        retryButton.hidden = true;
        listFeedback.hidden = false;
        return;
    }

    listFeedback.hidden = true;

    for (const issue of issues) {
        const card = cardTemplate.content.firstElementChild.cloneNode(true);
        card.dataset.status = issue.status;

        const icon = card.querySelector(".status-icon");
        icon.src = "assets/" + issue.status + "-status.png";
        icon.alt = issue.status === "closed" ? "Closed" : "Open";

        showPriority(card.querySelector(".priority-badge"), issue.priority);
        card.querySelector(".issue-card-title").textContent = issue.title;
        card.querySelector(".issue-card-description").textContent = issue.description;
        showLabels(card.querySelector(".issue-labels"), issue.labels);
        card.querySelector(".issue-card-author").textContent = "#" + issue.id + " by " + issue.author;
        card.querySelector(".issue-card-date").textContent = formatDate(issue.createdAt, "en-US");
        card.addEventListener("click", function () {
            openIssue(issue.id);
        });
        issueGrid.appendChild(card);
    }

    issueGrid.hidden = false;
}
function showPriority(badge, priority) {
    badge.textContent = priority;
    badge.dataset.priority = priority;
}

function showLabels(container, labels) {
    container.textContent = "";

    for (const label of labels) {
        const badge = document.createElement("span");
        badge.className = "badge issue-label";
        badge.dataset.label = label;
        badge.title = label;

        const text = document.createElement("span");
        text.className = "issue-label-text";
        text.textContent = label;
        badge.appendChild(text);
        container.appendChild(badge);
    }
}

function formatDate(date, locale) {
    return new Date(date).toLocaleDateString(locale, { timeZone: "UTC" });
}
