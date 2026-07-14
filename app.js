// Decidely BETA — Universal Decision Engine
// Flow: input → local crisis check → AI (Gemini) or demo fallback → dynamic lenses

const els = {
    dilemma: document.querySelector("#dilemmaInput"),
    analyzeButton: document.querySelector("#analyzeButton"),
    modeBadge: document.querySelector("#modeBadge"),
    errorBox: document.querySelector("#errorBox"),
    results: document.querySelector("#resultsSection"),
    contextChip: document.querySelector("#contextChip"),
    direction: document.querySelector("#direction"),
    confidenceNote: document.querySelector("#confidenceNote"),
    tabsNav: document.querySelector("#tabsNav"),
    analysisContent: document.querySelector("#analysisContent"),
    nextActions: document.querySelector("#nextActions"),
    history: document.querySelector("#history"),
    saveButton: document.querySelector("#saveButton"),
    exportButton: document.querySelector("#exportButton"),
    settingsButton: document.querySelector("#settingsButton"),
    settingsModal: document.querySelector("#settingsModal"),
    apiKeyInput: document.querySelector("#apiKeyInput"),
    saveKeyButton: document.querySelector("#saveKeyButton"),
    clearKeyButton: document.querySelector("#clearKeyButton"),
    compassionScreen: document.querySelector("#compassionScreen"),
    compassionBack: document.querySelector("#compassionBack"),
};

const state = { analysis: null, activeTab: 0 };

// ---------- Compassion Pause: local check, runs BEFORE any network call ----------
const CRISIS_PATTERNS = [
    /suicid/i, /kill (myself|me)/i, /end (my|it all|my own) life/i, /self[- ]harm/i,
    /hurt (myself|me)/i, /want to die/i, /don'?t want to (live|be alive)/i,
    /overdose/i, /no reason to live/i, /better off dead/i, /take my (own )?life/i,
];

function isCrisis(text) {
    return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

// ---------- API key (stored only in this browser) ----------
function getApiKey() {
    return localStorage.getItem("decidely-gemini-key") || "";
}

function updateModeBadge() {
    els.modeBadge.textContent = getApiKey()
        ? "AI mode — powered by your Gemini key"
        : "Demo mode — add your API key in Settings for real AI analysis";
}

// ---------- Provider adapter (Gemini first; others slot in later) ----------
const providers = {
    async gemini(dilemma, key) {
        const prompt = `You are Decidely, a decision-analysis assistant. A person shares a dilemma. Analyze it and respond ONLY with JSON matching this exact shape:
{
  "context": "business" | "personal" | "mixed",
  "direction": "one-sentence suggested direction, honest and non-prescriptive",
  "confidence_note": "one plain-language sentence on how sure this analysis is and why (no percentages)",
  "tabs": [ { "title": "lens name", "sections": [ { "title": "section name", "items": ["point", ...] } ] } ],
  "next_steps": ["concrete action", ...]
}
Rules:
- If context is business: use lenses like Pros & Cons, SWOT, Key Criteria.
- If context is personal/emotional: use lenses like Values Compass, Regret Minimization, Pros & Cons.
- If mixed: blend both. 2-4 tabs total, 3-5 items per section, 3 next steps.
- Be warm but honest. Never give medical, legal, or financial professional advice.

Dilemma: """${dilemma.replaceAll('"""', '')}"""`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        let response;
        try {
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
                    }),
                }
            );
        } finally {
            clearTimeout(timer);
        }

        if (response.status === 400 || response.status === 403) {
            throw new Error("That API key doesn't look valid. Check it in Settings (aistudio.google.com → Get API key).");
        }
        if (response.status === 429) {
            throw new Error("The AI service is rate-limiting right now. Wait a minute and try again.");
        }
        if (!response.ok) {
            throw new Error(`The AI service returned an error (${response.status}). Try again shortly.`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("The AI returned an empty answer. Try rephrasing your dilemma.");
        return JSON.parse(text);
    },
};

// ---------- Demo fallback (no key needed) ----------
function demoAnalysis(dilemma) {
    const personalWords = ["family", "parents", "marriage", "relationship", "move", "feel", "happy", "kids", "life", "friend", "home"];
    const tokens = dilemma.toLowerCase();
    const personalHits = personalWords.filter((word) => tokens.includes(word)).length;
    const context = personalHits >= 2 ? "personal" : personalHits === 1 ? "mixed" : "business";

    const businessTabs = [
        {
            title: "Pros & Cons",
            sections: [
                { title: "Pros", items: ["Forces your assumptions into the open.", "Can start as a small, reversible experiment.", "Creates a written record you can revisit."] },
                { title: "Cons", items: ["May need stakeholder alignment first.", "Short-term process work before payoff.", "A weak rollout can make a sound choice feel abrupt."] },
            ],
        },
        {
            title: "SWOT",
            sections: [
                { title: "Strengths", items: ["Clear framing", "Reusable record"] },
                { title: "Weaknesses", items: ["Depends on honest context", "Directional only"] },
                { title: "Opportunities", items: ["Repeatable playbook", "Better next decision"] },
                { title: "Threats", items: ["Biased input, biased output", "Overconfidence without evidence"] },
            ],
        },
    ];
    const personalTabs = [
        {
            title: "Values Compass",
            sections: [
                { title: "What seems to matter here", items: ["Connection with the people involved.", "Security vs. growth tension.", "Being able to look back without guilt."] },
                { title: "Questions to sit with", items: ["Which option would you choose if no one judged you?", "What does 'enough' look like for you here?"] },
            ],
        },
        {
            title: "Regret Minimization",
            sections: [
                { title: "At 80, looking back", items: ["Which choice would you regret NOT trying?", "Regret of action fades; regret of inaction compounds.", "What's genuinely reversible about each path?"] },
            ],
        },
    ];

    return {
        context,
        direction: "Run one small, reversible test of the option you're leaning toward before committing fully.",
        confidence_note: "This is demo mode — a generic framework, not real analysis of your situation. Add an API key for that.",
        tabs: context === "personal" ? personalTabs : context === "mixed" ? [personalTabs[0], businessTabs[0]] : businessTabs,
        next_steps: [
            "Write down the two assumptions that would change your mind.",
            "Name the decision deadline and who it affects.",
            "Identify the smallest reversible first step.",
        ],
    };
}

// ---------- UI ----------
function showError(message) {
    els.errorBox.textContent = message;
    els.errorBox.hidden = false;
}

function clearError() {
    els.errorBox.hidden = true;
}

function renderAnalysis(analysis) {
    state.analysis = analysis;
    state.activeTab = 0;

    const chipLabels = { business: "💼 Business decision", personal: "💛 Personal decision", mixed: "🔀 Mixed decision" };
    els.contextChip.textContent = chipLabels[analysis.context] || "Decision";
    els.direction.textContent = analysis.direction;
    els.confidenceNote.textContent = analysis.confidence_note;
    els.nextActions.innerHTML = (analysis.next_steps || []).map((step) => `<div>${escapeHtml(step)}</div>`).join("");

    renderTabs();
    els.results.hidden = false;
    els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTabs() {
    const tabs = state.analysis.tabs || [];
    els.tabsNav.innerHTML = tabs.map((tab, index) =>
        `<button class="tab ${index === state.activeTab ? "active" : ""}" data-tab="${index}">${escapeHtml(tab.title)}</button>`
    ).join("");
    els.tabsNav.querySelectorAll("[data-tab]").forEach((button) => {
        button.addEventListener("click", () => {
            state.activeTab = Number(button.dataset.tab);
            renderTabs();
        });
    });

    const active = tabs[state.activeTab];
    if (!active) { els.analysisContent.innerHTML = ""; return; }
    els.analysisContent.innerHTML = `
        <div class="two-column">
            ${(active.sections || []).map((section) => `
                <section class="result-box">
                    <h3>${escapeHtml(section.title)}</h3>
                    <ul>${(section.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                </section>
            `).join("")}
        </div>
    `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

// ---------- Analyze flow ----------
async function analyze() {
    clearError();
    const dilemma = els.dilemma.value.trim();
    if (!dilemma) {
        showError("Describe your decision first — a sentence or two is enough.");
        return;
    }

    // Compassion Pause: local check BEFORE anything is sent anywhere.
    if (isCrisis(dilemma)) {
        els.compassionScreen.hidden = false;
        return;
    }

    const key = getApiKey();
    els.analyzeButton.disabled = true;
    els.analyzeButton.textContent = key ? "Thinking…" : "Preparing demo…";

    try {
        const analysis = key ? await providers.gemini(dilemma, key) : demoAnalysis(dilemma);
        if (!analysis || !Array.isArray(analysis.tabs)) {
            throw new Error("The AI answer wasn't in the expected format. Try again.");
        }
        analysis.dilemma = dilemma;
        renderAnalysis(analysis);
    } catch (error) {
        if (error.name === "AbortError") {
            showError("The AI took too long to respond (30s). Check your connection and try again.");
        } else if (error instanceof SyntaxError) {
            showError("The AI answer couldn't be read. Try again — this is usually temporary.");
        } else {
            showError(error.message || "Something went wrong. Try again.");
        }
    } finally {
        els.analyzeButton.disabled = false;
        els.analyzeButton.textContent = "Untangle this";
    }
}

// ---------- Save / history / export ----------
function getSaved() {
    return JSON.parse(localStorage.getItem("decidely-decisions") || "[]");
}

function saveCurrentDecision() {
    if (!state.analysis) return;
    const nextSaved = [
        {
            id: crypto.randomUUID(),
            createdAt: new Date().toLocaleString(),
            analysis: state.analysis,
        },
        ...getSaved(),
    ].slice(0, 12);
    localStorage.setItem("decidely-decisions", JSON.stringify(nextSaved));
    renderHistory();
}

function renderHistory() {
    const saved = getSaved();
    els.history.innerHTML = saved.length
        ? saved.map((item) => `
            <article class="history-item">
                <button data-load="${item.id}">${escapeHtml(item.analysis.dilemma || "Saved decision")}</button>
                <div class="history-meta"><span>${item.createdAt}</span></div>
            </article>
        `).join("")
        : "<p>No saved decisions yet.</p>";

    els.history.querySelectorAll("[data-load]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = getSaved().find((saved) => saved.id === button.dataset.load);
            if (!item) return;
            els.dilemma.value = item.analysis.dilemma || "";
            renderAnalysis(item.analysis);
        });
    });
}

// ---------- Events ----------
els.analyzeButton.addEventListener("click", analyze);
els.dilemma.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) analyze();
});

els.saveButton.addEventListener("click", saveCurrentDecision);
els.exportButton.addEventListener("click", () => {
    if (!state.analysis) return;
    const blob = new Blob([JSON.stringify(state.analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "decidely-decision.json";
    link.click();
    URL.revokeObjectURL(url);
});

// ---------- Test API key ----------
async function testApiKey() {
    const key = els.apiKeyInput.value.trim();
    if (!key) {
        showError("Paste an API key first.");
        return;
    }

    const testBtn = document.querySelector("#testKeyButton");
    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.textContent = "Testing…";

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Respond with: OK" }] }],
                    generationConfig: { responseMimeType: "application/json" },
                }),
            }
        );

        if (response.status === 400 || response.status === 403) {
            showError("❌ API key is invalid. Get a fresh key at aistudio.google.com/api-keys");
        } else if (response.status === 429) {
            showError("✅ API key is valid! Gemini is rate-limited right now. Wait ~1 min, then use it normally.");
        } else if (!response.ok) {
            showError(`❌ API error (${response.status}). Try again or check your connection.`);
        } else {
            showError("✅ API key works perfectly! Save it to use real AI analysis.");
        }
    } catch (err) {
        showError("❌ Connection error. Check your internet and key format.");
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = originalText;
    }
}

els.settingsButton.addEventListener("click", () => {
    els.apiKeyInput.value = getApiKey();
    els.settingsModal.hidden = false;
});
els.settingsModal.addEventListener("click", (event) => {
    if (event.target === els.settingsModal) els.settingsModal.hidden = true;
});
document.querySelector("#testKeyButton").addEventListener("click", testApiKey);
els.saveKeyButton.addEventListener("click", () => {
    const key = els.apiKeyInput.value.trim();
    if (key) localStorage.setItem("decidely-gemini-key", key);
    els.settingsModal.hidden = true;
    updateModeBadge();
});
els.clearKeyButton.addEventListener("click", () => {
    localStorage.removeItem("decidely-gemini-key");
    els.apiKeyInput.value = "";
    els.settingsModal.hidden = true;
    updateModeBadge();
});
els.compassionBack.addEventListener("click", () => {
    els.compassionScreen.hidden = true;
});

updateModeBadge();
renderHistory();
