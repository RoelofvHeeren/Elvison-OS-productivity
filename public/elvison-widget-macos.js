// Elvison OS Dashboard Widget for macOS (ScriptWidget / Übersicht)
// ================================================================
// This script is designed for macOS widget apps that use JavaScript.
// Tested with: ScriptWidget (App Store)
// 
// SETUP:
// 1. Install ScriptWidget from the Mac App Store
// 2. Create a new widget and paste this code
// 3. Replace WIDGET_TOKEN with your token from App Settings
// ================================================================

// Configuration - UPDATE THESE VALUES
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE"; // Get this from your App Settings
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";
const BG_IMAGE_URL = "https://elvison-os-productivity-production.up.railway.app/widget-bg.png";

// Colors - Black, Teal, White theme
const COLORS = {
    bg: "#0F0F11",
    teal: "#139187",
    white: "#FFFFFF",
    gray: "#AAAAAA",
    darkGray: "#666666"
};

// ================================================================
// ScriptWidget Version (JSX-like syntax)
// ================================================================

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
}

async function fetchData() {
    try {
        const url = `${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.error("Failed to fetch data:", e);
        return {
            stats: { tasksRemaining: "-", habitsCompleted: "-", habitsTotal: "-" },
            tasks: []
        };
    }
}

async function render() {
    const data = await fetchData();
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Build task list HTML
    let tasksHtml = '';
    if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
            const timeLabel = task.dueTime ? `<span style="color: ${COLORS.gray}; font-size: 10px;">${task.dueTime}</span>` : '';
            tasksHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="color: ${COLORS.teal}; font-size: 8px; margin-right: 6px;">●</span>
                    <span style="color: ${COLORS.white}; font-size: 12px; flex: 1;">${task.title}</span>
                    ${timeLabel}
                </div>
            `;
        }
        if (data.stats.tasksRemaining > data.tasks.length) {
            tasksHtml += `<div style="color: ${COLORS.gray}; font-size: 11px; font-style: italic;">+${data.stats.tasksRemaining - data.tasks.length} more</div>`;
        }
    } else {
        tasksHtml = `<div style="color: ${COLORS.gray}; font-size: 13px;">No tasks for today ✓</div>`;
    }

    return `
        <div style="
            background-color: ${COLORS.bg};
            background-image: url('${BG_IMAGE_URL}');
            background-size: cover;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            height: 100%;
            box-sizing: border-box;
        ">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <a href="${APP_URL}" style="color: ${COLORS.teal}; font-weight: bold; font-size: 14px; text-decoration: none;">ELVISON OS</a>
                <span style="color: ${COLORS.white}; font-size: 11px;">${dateStr}</span>
            </div>
            
            <!-- Greeting -->
            <div style="color: ${COLORS.white}; font-size: 22px; font-weight: 100; margin-top: 10px;">
                ${getGreeting()}
            </div>
            
            <!-- Capture Buttons -->
            <div style="display: flex; gap: 10px; margin-top: 14px;">
                <a href="${APP_URL}/capture?mode=task" style="background: rgba(19, 145, 135, 0.25); border-radius: 8px; padding: 6px 12px; color: ${COLORS.white}; font-size: 12px; font-weight: 600; text-decoration: none;">Task</a>
                <a href="${APP_URL}/capture?mode=note" style="background: rgba(19, 145, 135, 0.25); border-radius: 8px; padding: 6px 12px; color: ${COLORS.white}; font-size: 12px; font-weight: 600; text-decoration: none;">Note</a>
                <a href="${APP_URL}/capture?mode=reminder" style="background: rgba(19, 145, 135, 0.25); border-radius: 8px; padding: 6px 12px; color: ${COLORS.white}; font-size: 12px; font-weight: 600; text-decoration: none;">Reminder</a>
            </div>
            
            <!-- Stats -->
            <div style="display: flex; justify-content: space-between; margin-top: 16px;">
                <div>
                    <div style="color: ${COLORS.teal}; font-size: 24px; font-weight: bold;">${data.stats.tasksRemaining}</div>
                    <div style="color: ${COLORS.white}; font-size: 10px;">Tasks Left</div>
                </div>
                <div>
                    <div style="color: ${COLORS.teal}; font-size: 24px; font-weight: bold;">${data.stats.habitsCompleted}/${data.stats.habitsTotal}</div>
                    <div style="color: ${COLORS.white}; font-size: 10px;">Habits</div>
                </div>
            </div>
            
            <!-- Today's Tasks -->
            <div style="margin-top: 16px;">
                <div style="color: ${COLORS.white}; font-size: 10px; font-weight: bold; margin-bottom: 8px;">TODAY'S TASKS</div>
                ${tasksHtml}
            </div>
            
            <!-- Footer -->
            <div style="color: ${COLORS.darkGray}; font-size: 8px; text-align: center; margin-top: auto; padding-top: 10px;">
                Updated ${timeStr}
            </div>
        </div>
    `;
}

// Export for ScriptWidget
// If using ScriptWidget, uncomment the line below:
// widget.html = await render();

// For testing in browser or Node.js:
render().then(html => console.log(html));
