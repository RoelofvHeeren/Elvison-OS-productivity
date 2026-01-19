// Elvison OS Dashboard Widget for ScriptWidget (macOS)
// ====================================================
// SETUP: 
// 1. Create a new widget in ScriptWidget
// 2. Paste this code
// 3. Your token is already embedded!

// Configuration
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE";
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";

// Get greeting based on time of day
function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
}

// Fetch data from API
const data = await $fetch(`${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`)
    .then(res => res.json())
    .catch(() => ({
        stats: { tasksRemaining: "-", habitsCompleted: "-", habitsTotal: "-" },
        tasks: []
    }));

// Date formatting
const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Build task items
const taskItems = data.tasks && data.tasks.length > 0
    ? data.tasks.slice(0, 5).map(task => (
        <hstack>
            <text color="#139187" font="10">●</text>
            <spacer length="4" />
            <text color="white" font="12">{task.title}</text>
            <spacer />
            {task.dueTime && <text color="#AAAAAA" font="10">{task.dueTime}</text>}
        </hstack>
    ))
    : [<text color="#AAAAAA" font="13">No tasks for today ✓</text>];

// Render the widget
$render(
    <vstack
        background="#0F0F11"
        padding="16"
        frame="max"
    >
        {/* Header */}
        <hstack>
            <text color="#139187" font="bold,14">ELVISON OS</text>
            <spacer />
            <text color="white" font="11">{dateStr}</text>
        </hstack>

        <spacer length="10" />

        {/* Greeting */}
        <text color="white" font="thin,22">{getGreeting()}</text>

        <spacer length="12" />

        {/* Quick Action Buttons */}
        <hstack>
            <link url={`${APP_URL}/capture?mode=task`}>
                <text
                    color="white"
                    font="semibold,11"
                    padding="6,10"
                    background="rgba(19,145,135,0.25)"
                    cornerRadius="8"
                >Task</text>
            </link>
            <spacer length="8" />
            <link url={`${APP_URL}/capture?mode=note`}>
                <text
                    color="white"
                    font="semibold,11"
                    padding="6,10"
                    background="rgba(19,145,135,0.25)"
                    cornerRadius="8"
                >Note</text>
            </link>
            <spacer length="8" />
            <link url={`${APP_URL}/capture?mode=reminder`}>
                <text
                    color="white"
                    font="semibold,11"
                    padding="6,10"
                    background="rgba(19,145,135,0.25)"
                    cornerRadius="8"
                >Reminder</text>
            </link>
        </hstack>

        <spacer length="14" />

        {/* Stats Row */}
        <hstack>
            <vstack>
                <text color="#139187" font="bold,24">{data.stats.tasksRemaining}</text>
                <text color="white" font="10">Tasks Left</text>
            </vstack>
            <spacer />
            <vstack alignment="trailing">
                <text color="#139187" font="bold,24">{data.stats.habitsCompleted}/{data.stats.habitsTotal}</text>
                <text color="white" font="10">Habits</text>
            </vstack>
        </hstack>

        <spacer length="14" />

        {/* Tasks Section */}
        <text color="white" font="bold,10">TODAY'S TASKS</text>
        <spacer length="6" />

        <vstack spacing="4">
            {taskItems}
        </vstack>

        {data.stats.tasksRemaining > 5 && (
            <text color="#AAAAAA" font="italic,11">+{data.stats.tasksRemaining - 5} more</text>
        )}

        <spacer />

        {/* Footer */}
        <text color="#666666" font="8" alignment="center">Updated {timeStr}</text>
    </vstack>
);
