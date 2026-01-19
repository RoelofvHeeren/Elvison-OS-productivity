// Elvison Calendar Widget for macOS (ScriptWidget / Übersicht)
// =============================================================
// This script is designed for macOS widget apps that use JavaScript.
// Tested with: ScriptWidget (App Store)
// 
// SETUP:
// 1. Install ScriptWidget from the Mac App Store
// 2. Create a new widget and paste this code
// 3. Replace WIDGET_TOKEN with your token from App Settings
// =============================================================

// Configuration - UPDATE THESE VALUES
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE"; // Get this from your App Settings
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/calendar";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";
const BG_IMAGE_URL = "https://elvison-os-productivity-production.up.railway.app/widget-bg-calendar.png";

// Colors
const COLORS = {
    bg: "#0F0F11",
    teal: "#139187",
    white: "#FFFFFF",
    gray: "#AAAAAA",
    lightGray: "#DDDDDD",
    blue: "#3B82F6"
};

// =============================================================
// ScriptWidget Version (HTML/CSS based)
// =============================================================

async function fetchData() {
    try {
        const url = `${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.error("Failed to fetch data:", e);
        return { events: [], affirmation: "" };
    }
}

async function render() {
    const data = await fetchData();
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Build events HTML
    let eventsHtml = '';
    const maxEvents = 4;

    if (data.events && data.events.length > 0) {
        for (let i = 0; i < Math.min(data.events.length, maxEvents); i++) {
            const event = data.events[i];
            let timeStr = "All Day";

            if (!event.isAllDay) {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                timeStr = `${startTime} - ${endTime}`;
            }

            const eventLink = event.htmlLink || `${APP_URL}/calendar`;

            eventsHtml += `
                <a href="${eventLink}" style="display: block; text-decoration: none; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 3px; height: 14px; background: ${COLORS.blue}; margin-right: 6px;"></div>
                        <span style="color: ${COLORS.white}; font-size: 10.2px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${event.title}</span>
                    </div>
                    <div style="color: ${COLORS.gray}; font-size: 10px; margin-left: 9px;">${timeStr}</div>
                </a>
            `;
        }

        if (data.events.length > maxEvents) {
            eventsHtml += `<div style="color: ${COLORS.gray}; font-size: 10px; font-style: italic;">+ ${data.events.length - maxEvents} more events</div>`;
        }
    } else {
        eventsHtml = `<div style="color: ${COLORS.gray}; font-size: 14px;">No events today</div>`;
    }

    // Affirmation
    const affirmationHtml = data.affirmation
        ? `<div style="color: ${COLORS.white}; font-size: 10px; font-style: italic; margin-top: 4px; max-width: 80px;">${data.affirmation}</div>`
        : '';

    return `
        <div style="
            background-color: ${COLORS.bg};
            background-image: url('${BG_IMAGE_URL}');
            background-size: cover;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            height: 100%;
            box-sizing: border-box;
            display: flex;
        ">
            <!-- Left Column: Date & Add Button -->
            <div style="width: 80px; display: flex; flex-direction: column; align-items: flex-start;">
                <div style="color: ${COLORS.white}; font-size: 16px; font-weight: bold; font-family: 'Playfair Display', Georgia, serif;">
                    ${dateStr}
                </div>
                ${affirmationHtml}
                <div style="margin-top: 10px;">
                    <a href="${APP_URL}/capture?mode=calendar" style="
                        background: ${COLORS.teal};
                        border-radius: 6px;
                        padding: 4px 8px;
                        color: ${COLORS.white};
                        font-size: 10px;
                        font-weight: bold;
                        text-decoration: none;
                        display: inline-block;
                    ">+ Add</a>
                </div>
            </div>
            
            <!-- Spacer -->
            <div style="width: 10px;"></div>
            
            <!-- Right Column: Events -->
            <div style="flex: 1; display: flex; flex-direction: column;">
                ${eventsHtml}
            </div>
        </div>
    `;
}

// Export for ScriptWidget
// If using ScriptWidget, uncomment the line below:
// widget.html = await render();

// For testing in browser or Node.js:
render().then(html => console.log(html));
