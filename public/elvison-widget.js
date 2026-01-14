// Elvison OS Widget for Scriptable
// Copy this content into a new script in the Scriptable app

// Configuration
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
const API_KEY = "elvison-widget-secret"; // Keep for backward compatibility if needed, but mainly use token
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE"; // Get this from your App Settings
const USER_ID = ""; // valid user id is resolved from token on server
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
    if (config.widgetFamily === 'small') {
        widget = await createSmallWidget();
    } else if (config.widgetFamily === 'large') {
        widget = await createLargeWidget();
    } else {
        widget = await createMediumWidget();
    }
    Script.setWidget(widget);
} else {
    widget = await createLargeWidget();
    widget.presentLarge();
}
Script.complete();

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
}

async function createSmallWidget() {
    const w = new ListWidget();
    w.backgroundColor = new Color(COLORS.bg);
    w.setPadding(12, 12, 12, 12);
    const txt = w.addText("Use MEDIUM or LARGE");
    txt.textColor = new Color(COLORS.white);
    txt.font = Font.systemFont(11);
    txt.centerAlignText();
    return w;
}

async function createMediumWidget() {
    const data = await fetchData();
    const w = new ListWidget();
    w.setPadding(16, 16, 16, 16);

    // Background
    const bgImage = await getBackgroundImage();
    if (bgImage) {
        w.backgroundImage = bgImage;
    } else {
        w.backgroundColor = new Color(COLORS.bg);
    }

    // Header
    const headerStack = w.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();
    const title = headerStack.addText("ELVISON OS");
    title.font = Font.boldSystemFont(12);
    title.textColor = new Color(COLORS.teal);
    title.url = APP_URL;
    headerStack.addSpacer();
    const date = headerStack.addText(new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    date.font = Font.systemFont(10);
    date.textColor = new Color(COLORS.white);
    w.addSpacer(12);

    // Greeting
    const greeting = w.addText(getGreeting());
    greeting.font = Font.thinSystemFont(18);
    greeting.textColor = new Color(COLORS.white);
    w.addSpacer(12);

    // Capture Buttons - White text
    const btnStack = w.addStack();
    btnStack.layoutHorizontally();
    addCaptureBtn(btnStack, "Task", `${APP_URL}/capture?mode=task`);
    btnStack.addSpacer(10);
    addCaptureBtn(btnStack, "Note", `${APP_URL}/capture?mode=note`);
    btnStack.addSpacer(10);
    addCaptureBtn(btnStack, "Reminder", `${APP_URL}/capture?mode=reminder`);
    w.addSpacer(16);

    // Stats
    const statsStack = w.addStack();
    statsStack.layoutHorizontally();
    addStat(statsStack, data.stats.tasksRemaining.toString(), "Tasks Left");
    statsStack.addSpacer();
    addStat(statsStack, `${data.stats.habitsCompleted}/${data.stats.habitsTotal}`, "Habits");
    w.addSpacer(10);

    // Footer
    const footer = w.addText(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    footer.font = Font.systemFont(8);
    footer.textColor = new Color(COLORS.darkGray);
    footer.centerAlignText();

    return w;
}

async function createLargeWidget() {
    const data = await fetchData();
    const w = new ListWidget();
    w.setPadding(20, 20, 20, 20);
    w.url = APP_URL;

    // Background
    const bgImage = await getBackgroundImage();
    if (bgImage) {
        w.backgroundImage = bgImage;
    } else {
        w.backgroundColor = new Color(COLORS.bg);
    }

    // Header
    const headerStack = w.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();
    const title = headerStack.addText("ELVISON OS");
    title.font = Font.boldSystemFont(14);
    title.textColor = new Color(COLORS.teal);
    headerStack.addSpacer();
    const date = headerStack.addText(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    date.font = Font.systemFont(11);
    date.textColor = new Color(COLORS.white);
    w.addSpacer(10);

    // Greeting
    const greeting = w.addText(getGreeting());
    greeting.font = Font.thinSystemFont(22);
    greeting.textColor = new Color(COLORS.white);
    w.addSpacer(14);

    // Capture Buttons - White text
    const btnStack = w.addStack();
    btnStack.layoutHorizontally();
    addCaptureBtn(btnStack, "Task", `${APP_URL}/capture?mode=task`);
    btnStack.addSpacer(10);
    addCaptureBtn(btnStack, "Note", `${APP_URL}/capture?mode=note`);
    btnStack.addSpacer(10);
    addCaptureBtn(btnStack, "Reminder", `${APP_URL}/capture?mode=reminder`);
    w.addSpacer(16);

    // Stats Row
    const statsStack = w.addStack();
    statsStack.layoutHorizontally();
    addStat(statsStack, data.stats.tasksRemaining.toString(), "Tasks Left");
    statsStack.addSpacer();
    addStat(statsStack, `${data.stats.habitsCompleted}/${data.stats.habitsTotal}`, "Habits");
    w.addSpacer(16);

    // Today's Tasks Section
    const sectionTitle = w.addText("TODAY'S TASKS");
    sectionTitle.font = Font.boldSystemFont(10);
    sectionTitle.textColor = new Color(COLORS.white);
    w.addSpacer(8);

    if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
            const taskStack = w.addStack();
            taskStack.layoutHorizontally();
            taskStack.centerAlignContent();
            taskStack.url = APP_URL;

            // Teal bullet
            const dot = taskStack.addText("●");
            dot.font = Font.systemFont(8);
            dot.textColor = new Color(COLORS.teal);
            taskStack.addSpacer(6);

            // Task title - NO truncation, allow wrapping
            const taskTitle = taskStack.addText(task.title);
            taskTitle.font = Font.systemFont(12);
            taskTitle.textColor = new Color(COLORS.white);
            taskTitle.lineLimit = 2;

            taskStack.addSpacer();

            // Due time if exists
            if (task.dueTime) {
                const timeText = taskStack.addText(task.dueTime);
                timeText.font = Font.systemFont(10);
                timeText.textColor = new Color(COLORS.gray);
            }

            w.addSpacer(5);
        }

        if (data.stats.tasksRemaining > data.tasks.length) {
            const moreText = w.addText(`+${data.stats.tasksRemaining - data.tasks.length} more`);
            moreText.font = Font.italicSystemFont(11);
            moreText.textColor = new Color(COLORS.gray);
        }
    } else {
        const noTasks = w.addText("No tasks for today ✓");
        noTasks.font = Font.systemFont(13);
        noTasks.textColor = new Color(COLORS.gray);
    }

    w.addSpacer();

    // Footer
    const footer = w.addText(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    footer.font = Font.systemFont(8);
    footer.textColor = new Color(COLORS.darkGray);
    footer.centerAlignText();

    return w;
}

function addStat(stack, value, label) {
    const col = stack.addStack();
    col.layoutVertically();
    const valText = col.addText(value);
    valText.font = Font.boldSystemFont(24);
    valText.textColor = new Color(COLORS.teal);
    const labelText = col.addText(label);
    labelText.font = Font.systemFont(10);
    labelText.textColor = new Color(COLORS.white);
}

function addCaptureBtn(stack, label, url) {
    const btn = stack.addStack();
    btn.backgroundColor = new Color(COLORS.teal, 0.25);
    btn.cornerRadius = 8;
    btn.setPadding(6, 12, 6, 12);
    btn.url = url;
    const txt = btn.addText(label);
    txt.font = Font.semiboldSystemFont(12);
    txt.textColor = new Color(COLORS.white);
}

async function fetchData() {
    try {
        // Use token preference if available
        const url = `${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`;
        const req = new Request(url);
        return await req.loadJSON();
    } catch (e) {
        return {
            stats: { tasksRemaining: "-", habitsCompleted: "-", habitsTotal: "-" },
            tasks: []
        };
    }
}
