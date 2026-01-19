// Elvison Calendar Widget for ScriptWidget (macOS)
// =================================================
// SETUP: Paste this code into a new ScriptWidget script

// Configuration
const WIDGET_TOKEN = "PASTE_YOUR_TOKEN_HERE";
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/calendar";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";

// Fetch data from API
let data = { events: [], affirmation: "" };

try {
    const response = await $fetch(`${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}`);
    data = await response.json();
} catch (e) {
    // Fallback data
}

// Date formatting
const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Build events list
const eventList = [];
if (data.events && data.events.length > 0) {
    const maxEvents = 4;
    for (let i = 0; i < Math.min(data.events.length, maxEvents); i++) {
        const event = data.events[i];
        let timeStr = "All Day";
        if (!event.isAllDay) {
            const start = new Date(event.start);
            const end = new Date(event.end);
            timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        }
        eventList.push(
            <vstack key={String(i)} alignment="leading" spacing="1">
                <hstack>
                    <rectangle fill="#3B82F6" frame="3,12" cornerRadius="1" />
                    <spacer length="6" />
                    <text font="caption" color="white">{event.title}</text>
                </hstack>
                <text font="caption2" color="secondary">{timeStr}</text>
            </vstack>
        );
    }
    if (data.events.length > maxEvents) {
        eventList.push(<text key="more" font="caption2" color="secondary">+ {data.events.length - maxEvents} more</text>);
    }
} else {
    eventList.push(<text key="none" font="subheadline" color="secondary">No events today</text>);
}

// Render widget
$render(
    <zstack frame="max">
        {/* Dark background */}
        <rectangle fill="#0F0F11" />

        {/* Content */}
        <hstack padding="16">
            {/* Left column: date & add button */}
            <vstack alignment="leading" frame="70,max">
                <text font="headline" color="white">{dateStr}</text>

                {data.affirmation && (
                    <>
                        <spacer length="4" />
                        <text font="caption2" color="secondary">{data.affirmation}</text>
                    </>
                )}

                <spacer length="10" />

                <link url={`${APP_URL}/capture?mode=calendar`}>
                    <zstack>
                        <rectangle fill="#139187" cornerRadius="6" frame="50,24" />
                        <text font="caption" color="white">+ Add</text>
                    </zstack>
                </link>

                <spacer />
            </vstack>

            <spacer length="10" />

            {/* Right column: events */}
            <vstack alignment="leading" spacing="6">
                {eventList}
                <spacer />
            </vstack>
        </hstack>
    </zstack>
);
