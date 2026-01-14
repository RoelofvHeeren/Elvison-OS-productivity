// Elvison Calendar Widget for Scriptable
// Copy this content into a new script in the Scriptable app

// Configuration
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/calendar";
const API_KEY = "elvison-widget-secret";
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE"; // Get this from your App Settings
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";
// Use a different valid background or the same one
const BG_IMAGE_URL = "https://elvison-os-productivity-production.up.railway.app/widget-bg-calendar.png";

// Colors
const COLORS = {
    bg: "#0F0F11",
    teal: "#139187",
    white: "#FFFFFF",
    gray: "#AAAAAA",
    lightGray: "#DDDDDD",
    blue: "#3B82F6" // Standard blue for calendar events
};

// Fetch background image
async function getBackgroundImage() {
    try {
        const req = new Request(BG_IMAGE_URL);
        return await req.loadImage();
    } catch (e) {
        return null;
    }
}

let widget;
if (config.runsInWidget) {
    widget = await createMediumWidget();
    Script.setWidget(widget);
} else {
    widget = await createMediumWidget();
    widget.presentMedium();
}
Script.complete();


async function createMediumWidget() {
    const data = await fetchData();
    const w = new ListWidget();
    w.setPadding(12, 12, 12, 12);

    // Background
    const bgImage = await getBackgroundImage();
    if (bgImage) {
        w.backgroundImage = bgImage;
    } else {
        w.backgroundColor = new Color(COLORS.bg);
    }

    // Main Layout: Two Columns (Left for Date, Right for Events)
    const mainStack = w.addStack();
    mainStack.layoutHorizontally();

    // LEFT COLUMN: Date
    const leftCol = mainStack.addStack();
    leftCol.layoutVertically();
    leftCol.size = new Size(60, 0); // Reduced width

    const today = new Date();

    const weekday = leftCol.addText(today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
    weekday.font = Font.systemFont(12);
    weekday.textColor = new Color(COLORS.gray);

    const dayNum = leftCol.addText(today.getDate().toString());
    dayNum.font = Font.boldSystemFont(36);
    dayNum.textColor = new Color(COLORS.white);

    // leftCol.addSpacer(); // REMOVED spacer to keep things tighter
    leftCol.addSpacer(10); // Small gap instead

    // Add Event Button (Small)
    const addBtn = leftCol.addStack();
    addBtn.backgroundColor = new Color(COLORS.teal);
    addBtn.cornerRadius = 6;
    addBtn.setPadding(4, 8, 4, 8);
    // Use special URL scheme to open capturing calendar event
    addBtn.url = `${APP_URL}/capture?mode=calendar`;

    const addTxt = addBtn.addText("+ Add");
    addTxt.font = Font.boldSystemFont(10);
    addTxt.textColor = new Color(COLORS.white);

    mainStack.addSpacer(10); // Reduced gap between columns

    // RIGHT COLUMN: Events
    const rightCol = mainStack.addStack();
    rightCol.layoutVertically();

    if (data.events && data.events.length > 0) {
        // Show max 5 events
        const maxEvents = 5;
        for (let i = 0; i < Math.min(data.events.length, maxEvents); i++) {
            const event = data.events[i];
            const eventStack = rightCol.addStack();
            eventStack.layoutVertically();
            eventStack.url = event.htmlLink || `${APP_URL}/calendar`; // Fallback to app calendar

            // Time & Title
            let timeStr = "All Day";
            if (!event.isAllDay) {
                const date = new Date(event.start);
                timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const endDate = new Date(event.end);
                const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                timeStr = `${timeStr} - ${endStr}`;
            }

            // Color block simulation or just colored text
            const titleRow = eventStack.addStack();
            titleRow.layoutHorizontally();
            titleRow.centerAlignContent();

            // Blue Bar
            const bar = titleRow.addStack();
            bar.size = new Size(3, 14);
            bar.backgroundColor = new Color(COLORS.blue);

            titleRow.addSpacer(6);

            const titleTxt = titleRow.addText(event.title);
            titleTxt.font = Font.boldSystemFont(12);
            titleTxt.textColor = new Color(COLORS.white);
            titleTxt.lineLimit = 1;

            const timeTxt = eventStack.addText("   " + timeStr); // Indent to align with text
            timeTxt.font = Font.systemFont(10);
            timeTxt.textColor = new Color(COLORS.gray);

            rightCol.addSpacer(8);
        }

        if (data.events.length > maxEvents) {
            const moreTxt = rightCol.addText(`+ ${data.events.length - maxEvents} more events`);
            moreTxt.font = Font.italicSystemFont(10);
            moreTxt.textColor = new Color(COLORS.gray);
        }
    } else {
        const noEvents = rightCol.addText("No events today");
        noEvents.font = Font.systemFont(14);
        noEvents.textColor = new Color(COLORS.gray);
    }

    rightCol.addSpacer();

    return w;
}

async function fetchData() {
    try {
        const url = `${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`;
        const req = new Request(url);
        return await req.loadJSON();
    } catch (e) {
        return { events: [] };
    }
}
