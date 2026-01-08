// Elvison OS Widget for Scriptable
// Copy this content into a new script in the Scriptable app

// Configuration
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";

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
    w.backgroundColor = new Color("#0F0F11");
    const txt = w.addText("Please select MEDIUM or LARGE widget.");
    txt.textColor = Color.white();
    txt.font = Font.systemFont(12);
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
    title.url = APP_URL;
    headerStack.addSpacer();
    const date = headerStack.addText(new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    date.font = Font.systemFont(10);
    date.textColor = new Color("#666666");
    w.addSpacer(12);

    // Greeting
    const greeting = w.addText(getGreeting());
    greeting.font = Font.thinSystemFont(18);
    greeting.textColor = Color.white();
    w.addSpacer(12);

    // Capture Buttons
    const btnStack = w.addStack();
    btnStack.layoutHorizontally();
    addCaptureBtn(btnStack, "Task", `${APP_URL}/capture?mode=task`, "#3B82F6");
    btnStack.addSpacer(12);
    addCaptureBtn(btnStack, "Note", `${APP_URL}/capture?mode=note`, "#F59E0B");
    btnStack.addSpacer(12);
    addCaptureBtn(btnStack, "Reminder", `${APP_URL}/capture?mode=reminder`, "#10B981");
    w.addSpacer(20);

    // Stats
    const statsStack = w.addStack();
    statsStack.layoutHorizontally();
    addStat(statsStack, data.stats.tasksRemaining.toString(), "Tasks Left", "#3B82F6");
    statsStack.addSpacer();
    addStat(statsStack, `${data.stats.habitsCompleted}/${data.stats.habitsTotal}`, "Habits", "#10B981");
    w.addSpacer(12);

    // Footer
    const footer = w.addText(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    footer.font = Font.systemFont(8);
    footer.textColor = new Color("#444444");
    footer.centerAlignText();

    return w;
}

async function createLargeWidget() {
    const data = await fetchData();
    const w = new ListWidget();
    w.backgroundColor = new Color("#0F0F11");
    w.url = APP_URL;

    // Header
    const headerStack = w.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();
    const title = headerStack.addText("ELVISON OS");
    title.font = Font.boldSystemFont(14);
    title.textColor = new Color("#139187");
    headerStack.addSpacer();
    const date = headerStack.addText(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    date.font = Font.systemFont(11);
    date.textColor = new Color("#666666");
    w.addSpacer(10);

    // Greeting
    const greeting = w.addText(getGreeting());
    greeting.font = Font.thinSystemFont(22);
    greeting.textColor = Color.white();
    w.addSpacer(14);

    // Capture Buttons
    const btnStack = w.addStack();
    btnStack.layoutHorizontally();
    addCaptureBtn(btnStack, "Task", `${APP_URL}/capture?mode=task`, "#3B82F6");
    btnStack.addSpacer(12);
    addCaptureBtn(btnStack, "Note", `${APP_URL}/capture?mode=note`, "#F59E0B");
    btnStack.addSpacer(12);
    addCaptureBtn(btnStack, "Reminder", `${APP_URL}/capture?mode=reminder`, "#10B981");
    w.addSpacer(16);

    // Stats Row
    const statsStack = w.addStack();
    statsStack.layoutHorizontally();
    addStat(statsStack, data.stats.tasksRemaining.toString(), "Tasks Left", "#3B82F6");
    statsStack.addSpacer();
    addStat(statsStack, `${data.stats.habitsCompleted}/${data.stats.habitsTotal}`, "Habits", "#10B981");
    w.addSpacer(16);

    // Today's Tasks Section
    const sectionTitle = w.addText("TODAY'S TASKS");
    sectionTitle.font = Font.boldSystemFont(10);
    sectionTitle.textColor = new Color("#888888");
    w.addSpacer(8);

    if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
            const taskStack = w.addStack();
            taskStack.layoutHorizontally();
            taskStack.centerAlignContent();
            taskStack.url = APP_URL;

            // Priority indicator
            const priorityColor = task.priority === 'HIGH' ? '#EF4444' : task.priority === 'LOW' ? '#22C55E' : '#F59E0B';
            const dot = taskStack.addText("●");
            dot.font = Font.systemFont(8);
            dot.textColor = new Color(priorityColor);
            taskStack.addSpacer(6);

            // Task title
            const taskTitle = taskStack.addText(task.title.length > 28 ? task.title.substring(0, 28) + "..." : task.title);
            taskTitle.font = Font.systemFont(13);
            taskTitle.textColor = Color.white();
            taskTitle.lineLimit = 1;

            taskStack.addSpacer();

            // Due time if exists
            if (task.dueTime) {
                const timeText = taskStack.addText(task.dueTime);
                timeText.font = Font.systemFont(11);
                timeText.textColor = new Color("#666666");
            }

            w.addSpacer(6);
        }

        // Show "+X more" if there are more tasks
        if (data.stats.tasksRemaining > data.tasks.length) {
            const moreText = w.addText(`+${data.stats.tasksRemaining - data.tasks.length} more`);
            moreText.font = Font.italicSystemFont(11);
            moreText.textColor = new Color("#555555");
        }
    } else {
        const noTasks = w.addText("No tasks for today 🎉");
        noTasks.font = Font.systemFont(13);
        noTasks.textColor = new Color("#555555");
    }

    w.addSpacer();

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
    valText.font = Font.boldSystemFont(24);
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
            stats: {
                tasksRemaining: "-",
                habitsCompleted: "-",
                habitsTotal: "-"
            },
            tasks: []
        };
    }
}
