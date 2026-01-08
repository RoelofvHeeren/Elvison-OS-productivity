// Elvison OS Widget for Scriptable
// Copy this content into a new script in the Scriptable app

// Configuration
// Replace this with your deployed URL
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
// If you set a custom WIDGET_SECRET env var, replace it here
const API_KEY = "elvison-widget-secret";

let widget = await createWidget();
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentMedium();
}
Script.complete();

async function createWidget() {
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

    w.addSpacer(16);

    // Stats Row
    const statsStack = w.addStack();
    statsStack.layoutHorizontally();

    // Tasks
    addStat(statsStack, data.stats.tasksToday.toString(), "Tasks Today", "#3B82F6");
    statsStack.addSpacer();

    // Habits
    addStat(statsStack, `${data.stats.habitsCompleted}/${data.stats.habitsTotal}`, "Habits", "#10B981");
    statsStack.addSpacer();

    // Goals
    addStat(statsStack, data.stats.goals.toString(), "Active Goals", "#F59E0B");

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
                habitsTotal: "-",
                goals: "-"
            }
        };
    }
}
