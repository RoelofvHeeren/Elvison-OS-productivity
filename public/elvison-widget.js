// Elvison OS Widget for Scriptable
// Copy this content into a new script in the Scriptable app

// Configuration
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
const API_KEY = "elvison-widget-secret";

let widget;
if (config.runsInWidget) {
    if (config.widgetFamily === 'small') {
        widget = await createSmallWidget();
    } else {
        widget = await createMediumWidget();
    }
    Script.setWidget(widget);
} else {
    widget = await createMediumWidget();
    widget.presentMedium();
}
Script.complete();

async function createSmallWidget() {
    const w = new ListWidget();
    w.backgroundColor = new Color("#0F0F11");
    const txt = w.addText("Please select the MEDIUM size widget.");
    txt.textColor = Color.white();
    txt.centerAlignText();
    return w;
}

async function createMediumWidget() {
    const data = await fetchData();

    const w = new ListWidget();
    w.backgroundColor = new Color("#0F0F11");

    // Header
    const headerStack = w.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();

    const title = headerStack.addText("ELVISON OS");
    title.font = Font.boldSystemFont(12);
    title.textColor = new Color("#139187");
    title.url = "https://elvison-os-productivity-production.up.railway.app";

    headerStack.addSpacer();

    const date = headerStack.addText(new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    date.font = Font.systemFont(10);
    date.textColor = new Color("#666666");

    w.addSpacer(12);

    // Greeting
    const greeting = w.addText(data.greeting);
    greeting.font = Font.thinSystemFont(18);
    greeting.textColor = Color.white();

    w.addSpacer(12);

    // Capture Buttons Row
    const btnStack = w.addStack();
    btnStack.layoutHorizontally();

    // Task (Blue)
    addCaptureBtn(btnStack, "Task", "https://elvison-os-productivity-production.up.railway.app/capture?mode=task", "#3B82F6");
    btnStack.addSpacer(12);
    // Note (Orange)
    addCaptureBtn(btnStack, "Note", "https://elvison-os-productivity-production.up.railway.app/capture?mode=note", "#F59E0B");
    btnStack.addSpacer(12);
    // Reminder (Green)
    addCaptureBtn(btnStack, "Reminder", "https://elvison-os-productivity-production.up.railway.app/capture?mode=reminder", "#10B981");

    w.addSpacer(20);

    // Stats Row
    const statsStack = w.addStack();
    statsStack.layoutHorizontally();

    // Tasks
    addStat(statsStack, data.stats.tasksToday.toString(), "Tasks Today", "#3B82F6");
    statsStack.addSpacer();

    // Habits
    addStat(statsStack, `${data.stats.habitsCompleted}/${data.stats.habitsTotal}`, "Habits", "#10B981");

    w.addSpacer(12);

    // Footer
    const footer = w.addText(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    footer.font = Font.systemFont(8);
    footer.textColor = new Color("#444444");
    footer.centerAlignText();

    return w;
}

function addStat(stack, value, label, colorHex) {
    const col = stack.addStack();
    col.layoutVertically();

    const valText = col.addText(value);
    valText.font = Font.boldSystemFont(20);
    valText.textColor = new Color(colorHex);

    const labelText = col.addText(label);
    labelText.font = Font.systemFont(10);
    labelText.textColor = new Color("#888888");
}

function addCaptureBtn(stack, label, url, colorHex) {
    const btn = stack.addStack();
    btn.backgroundColor = new Color(colorHex, 0.2);
    btn.cornerRadius = 8;
    btn.setPadding(6, 12, 6, 12);
    btn.url = url;

    const txt = btn.addText(label);
    txt.font = Font.semiboldSystemFont(12);
    txt.textColor = new Color(colorHex);
}

async function fetchData() {
    try {
        const req = new Request(`${API_URL}?key=${API_KEY}`);
        const json = await req.loadJSON();
        return json;
    } catch (e) {
        return {
            greeting: "Hello",
            stats: {
                tasksToday: "-",
                habitsCompleted: "-",
                habitsTotal: "-"
            }
        };
    }
}
