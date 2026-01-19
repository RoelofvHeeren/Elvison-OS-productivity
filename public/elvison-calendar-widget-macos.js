// Elvison Calendar Widget for ScriptWidget (macOS)
// =================================================
// SETUP: 
// 1. Create a new widget in ScriptWidget
// 2. Paste this code
// 3. Your token is already embedded!

// Configuration
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE";
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/calendar";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";

// Fetch data from API using $http
let data = { events: [], affirmation: "" };

try {
    const response = await $http.get(`${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`);
    if (response && response.data) {
        data = response.data;
    }
} catch (e) {
    // Use fallback data on error
}

// Date formatting
const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Render the widget
$render(
    <hstack
        background="#0F0F11"
        padding={16}
        frame="max"
    >
        <vstack frame={[80, "max"]}>
            <text color="white" font="bold 16">{dateStr}</text>

            {data.affirmation && (
                <>
                    <spacer length={4} />
                    <text color="white" font="italic 10">{data.affirmation}</text>
                </>
            )}

            <spacer length={10} />

            <link url={APP_URL + "/capture?mode=calendar"}>
                <text color="white" font="bold 10" padding={[4, 8]} background="#139187" cornerRadius={6}>+ Add</text>
            </link>

            <spacer />
        </vstack>

        <spacer length={10} />

        <vstack spacing={8}>
            {data.events && data.events.length > 0 ? (
                data.events.slice(0, 4).map((event, i) => {
                    let timeStr = "All Day";
                    if (!event.isAllDay) {
                        const start = new Date(event.start);
                        const end = new Date(event.end);
                        timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + " - " + end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    }
                    return (
                        <vstack key={i} spacing={2}>
                            <hstack>
                                <rectangle fill="#3B82F6" frame={[3, 14]} cornerRadius={1} />
                                <spacer length={6} />
                                <text color="white" font="bold 11">{event.title}</text>
                            </hstack>
                            <text color="#AAAAAA" font="10">{timeStr}</text>
                        </vstack>
                    );
                })
            ) : (
                <text color="#AAAAAA" font="14">No events today</text>
            )}

            {data.events && data.events.length > 4 && (
                <text color="#AAAAAA" font="italic 10">+ {data.events.length - 4} more</text>
            )}

            <spacer />
        </vstack>
    </hstack>
);
