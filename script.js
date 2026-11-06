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

// Check the demo username and password.
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

// Use the search endpoint when the search box contains a query.
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

// Update the active tab and show the matching issues.
for (const button of filterButtons) {
    button.addEventListener("click", function () {
        activeStatus = button.dataset.status;

        for (const filterButton of filterButtons) {
            filterButton.setAttribute("aria-pressed", filterButton === button);
        }

        if (issuesLoaded) {
            showIssues();
        }
    });
}

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    loadIssues(searchInput.value.trim());
});

searchInput.addEventListener("input", function () {
    if (searchInput.value.trim() === "" && activeSearch !== "") {
        loadIssues();
    }
});

retryButton.addEventListener("click", function () {
    loadIssues(activeSearch);
});

// Open the modal and fetch the selected issue by its ID.
async function openIssue(issueId) {
    const requestNumber = ++lastDetailRequest;
    const modal = document.getElementById("issue-modal");
    const title = document.getElementById("modal-title");
    const meta = document.getElementById("modal-meta");
    const details = document.getElementById("modal-details");
    const updated = document.getElementById("modal-update");
    const loading = document.getElementById("modal-loading");
    const error = document.getElementById("modal-error");

    title.textContent = "Issue details";
    meta.hidden = true;
    details.hidden = true;
    updated.hidden = true;
    error.hidden = true;
    loading.hidden = false;
    modal.showModal();

    try {
        const issue = await fetchData("/issue/" + issueId);
        if (requestNumber !== lastDetailRequest || !modal.open) {
            return;
        }

        title.textContent = issue.title;

        const status = document.getElementById("modal-status");
        status.textContent = issue.status === "closed" ? "Closed" : "Opened";
        status.dataset.status = issue.status;

        document.getElementById("modal-author").textContent = "Opened by " + issue.author;
        document.getElementById("modal-created").textContent = formatDate(issue.createdAt, "en-GB");
        document.getElementById("modal-description").textContent = issue.description;
        document.getElementById("modal-assignee").textContent = issue.assignee || "Unassigned";
        updated.textContent = "Issue #" + issue.id + " · Updated " + formatDate(issue.updatedAt, "en-GB");

        showLabels(document.getElementById("modal-labels"), issue.labels);
        showPriority(document.getElementById("modal-priority"), issue.priority);

        meta.hidden = false;
        details.hidden = false;
        updated.hidden = false;
    } catch {
        if (requestNumber === lastDetailRequest && modal.open) {
            error.hidden = false;
        }
    } finally {
        if (requestNumber === lastDetailRequest) {
            loading.hidden = true;
        }
    }
}

document.getElementById("new-issue-button").addEventListener("click", function () {
    document.getElementById("new-issue-modal").showModal();
});
