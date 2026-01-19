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

// Fetch data from API
const data = await $fetch(`${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`)
    .then(res => res.json())
    .catch(() => ({ events: [], affirmation: "" }));

// Date formatting
const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Build event items (max 4)
const maxEvents = 4;
const eventItems = data.events && data.events.length > 0
    ? data.events.slice(0, maxEvents).map(event => {
        let timeStr = "All Day";
        if (!event.isAllDay) {
            const start = new Date(event.start);
            const end = new Date(event.end);
            timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        }
        return (
            <link url={event.htmlLink || `${APP_URL}/calendar`}>
                <vstack alignment="leading" spacing="2">
                    <hstack>
                        <rectangle fill="#3B82F6" frame="3,14" cornerRadius="1" />
                        <spacer length="6" />
                        <text color="white" font="bold,11" lineLimit="1">{event.title}</text>
                    </hstack>
                    <text color="#AAAAAA" font="10" padding="0,0,0,9">{timeStr}</text>
                </vstack>
            </link>
        );
    })
    : [<text color="#AAAAAA" font="14">No events today</text>];

const moreEvents = data.events && data.events.length > maxEvents
    ? data.events.length - maxEvents
    : 0;

// Render the widget
$render(
    <hstack
        background="#0F0F11"
        padding="16"
        frame="max"
    >
        {/* Left Column: Date & Add Button */}
        <vstack alignment="leading" frame="80,max">
            <text color="white" font="bold,16">{dateStr}</text>

            {data.affirmation && (
                <>
                    <spacer length="4" />
                    <text color="white" font="italic,10" lineLimit="3">{data.affirmation}</text>
                </>
            )}

            <spacer length="10" />

            <link url={`${APP_URL}/capture?mode=calendar`}>
                <text
                    color="white"
                    font="bold,10"
                    padding="4,8"
                    background="#139187"
                    cornerRadius="6"
                >+ Add</text>
            </link>

            <spacer />
        </vstack>

        <spacer length="10" />

        {/* Right Column: Events */}
        <vstack alignment="leading" spacing="8">
            {eventItems}

            {moreEvents > 0 && (
                <text color="#AAAAAA" font="italic,10">+ {moreEvents} more events</text>
            )}

            <spacer />
        </vstack>
    </hstack>
);
