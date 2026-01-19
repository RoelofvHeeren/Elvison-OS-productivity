// Elvison OS Dashboard Widget for ScriptWidget (macOS)
// ====================================================
// SETUP: Paste this code into a new ScriptWidget script

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
let data = {
    stats: { tasksRemaining: "...", habitsCompleted: "...", habitsTotal: "..." },
    tasks: []
};

try {
    const response = await $fetch(`${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`);
    data = await response.json();
} catch (e) {
    // Fallback data
}

// Date formatting
const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Build task list
const taskList = [];
if (data.tasks && data.tasks.length > 0) {
    for (let i = 0; i < Math.min(data.tasks.length, 4); i++) {
        taskList.push(
            <hstack key={String(i)}>
                <text font="caption" color="#139187">●</text>
                <spacer length="4" />
                <text font="caption" color="white" lineLimit="1">{data.tasks[i].title}</text>
            </hstack>
        );
    }
} else {
    taskList.push(<text key="none" font="caption" color="secondary">No tasks for today ✓</text>);
}

// Render widget
$render(
    <zstack frame="max" alignment="leading">
        {/* Layer 1: Fallback Background Color */}
        <rectangle fill="#0F0F11" />

        {/* Layer 2: Background Image (User uploaded) */}
        {/* 'resizable' and 'scaledToFill' ensure it covers the whole widget */}
        <image src="image/widget-bg.png" resizable="true" scaledToFill="true" />

        {/* Layer 3: Dimming Overlay for Readability */}
        <rectangle fill="black" opacity="0.3" />

        {/* Layer 4: Content */}
        <vstack alignment="leading" padding="16" frame="max">
            {/* Header row */}
            <hstack>
                <text font="headline" color="#139187">ELVISON OS</text>
                <spacer />
                <text font="caption" color="white">{dateStr}</text>
            </hstack>

            <spacer length="8" />

            {/* Greeting */}
            <text font="title" color="white">{getGreeting()}</text>

            <spacer length="10" />

            {/* Quick buttons */}
            <hstack>
                <link url={`${APP_URL}/capture?mode=task`}>
                    <zstack>
                        <rectangle fill="#139187" cornerRadius="8" frame="50,28" opacity="0.9" />
                        <text font="caption" color="white">Task</text>
                    </zstack>
                </link>
                <spacer length="8" />
                <link url={`${APP_URL}/capture?mode=note`}>
                    <zstack>
                        <rectangle fill="#139187" cornerRadius="8" frame="50,28" opacity="0.9" />
                        <text font="caption" color="white">Note</text>
                    </zstack>
                </link>
            </hstack>

            <spacer length="12" />

            {/* Stats */}
            <hstack>
                <vstack alignment="leading">
                    <text font="title" color="#139187">{String(data.stats.tasksRemaining)}</text>
                    <text font="caption2" color="white">Tasks Left</text>
                </vstack>
                <spacer />
                <vstack alignment="trailing">
                    <text font="title" color="#139187">{String(data.stats.habitsCompleted)}/{String(data.stats.habitsTotal)}</text>
                    <text font="caption2" color="white">Habits</text>
                </vstack>
            </hstack>

            <spacer length="10" />

            {/* Tasks section */}
            <text font="caption2" color="secondary">TODAY'S TASKS</text>
            <spacer length="4" />
            <vstack alignment="leading" spacing="2">
                {taskList}
            </vstack>

            <spacer />

            {/* Footer */}
            <text font="caption2" color="secondary">Updated {timeStr}</text>
        </vstack>
    </zstack>
);
