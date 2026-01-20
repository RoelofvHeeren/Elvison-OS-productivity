// Elvison Calendar Widget for Übersicht
// ===========================================
// SETUP:
// 1. Install Übersicht (http://tracesof.net/uebersicht/)
// 2. Open Widgets Folder (from Übersicht menu bar icon)
// 3. Move this file into that folder
// 4. Edit the positioning below if needed

// Configuration (API Token is injected automatically)
const WIDGET_TOKEN = "WIDGET_TOKEN";
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/calendar";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";
const BG_IMAGE = "https://elvison-os-productivity-production.up.railway.app/widget-bg.png"; // Calendar might share bg or use different one

// Command
export const command = `curl -s "${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}"`;

// Refresh every hour
export const refreshFrequency = 3600000;

export const updateState = (event, previousState) => {
    if (event.error) return { ...previousState, error: event.error };
    try {
        return { data: JSON.parse(event.output) };
    } catch (e) {
        return { ...previousState, error: e.toString() };
    }
};

// Styling - POSITION: Edit 'top' and 'left' values to move this widget
export const className = `
  top: 420px;  /* Below dashboard widget */
  left: 40px;  /* Same left position as dashboard */
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
  
  .elvison-cal-widget {
    background-color: #0F0F11;
    background-image: url('${BG_IMAGE}');
    background-size: 100% 100%; /* Stretch to fit exactly */
    background-position: center;
    /* No border-radius - let the background image define the shape */
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    overflow: visible;
    position: relative;
    padding: 16px;
  }

  /* Overlay - hidden since image already has dark tint */
  .elvison-overlay {
    display: none;
  }

  .content {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 16px;
  }

  .left-col { flex: 0 0 70px; display: flex; flex-direction: column; }
  .right-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }

  .date-display { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.2; }
  
  .affirmation {
    font-size: 9px;
    font-style: italic;
    opacity: 0.7;
    margin-top: 8px;
    line-height: 1.3;
  }

  .add-btn {
    margin-top: auto;
    background: #139187;
    color: white;
    text-decoration: none;
    font-size: 10px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-block;
    text-align: center;
    align-self: flex-start;
  }

  .event {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .event-header { display: flex; align-items: center; }
  .bar { width: 3px; height: 12px; background: #3B82F6; border-radius: 1px; margin-right: 6px; }
  .title { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
  
  .time { font-size: 9px; color: #aaa; margin-left: 9px; }
  
  .empty { font-size: 12px; color: #fff; opacity: 0.5; padding: 10px 0; }
  .more { font-size: 10px; opacity: 0.5; font-style: italic; margin-top: 4px; }
`;

export const render = ({ data, error }) => {
    if (!data) return <div className="elvison-cal-widget"><div className="elvison-overlay" /> Loading...</div>;

    const { events, affirmation } = data;
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return (
        <div className="elvison-cal-widget">
            <div className="elvison-overlay" />
            <div className="content">

                {/* Left Column */}
                <div className="left-col">
                    <div className="date-display">{dateStr}</div>
                    {affirmation && <div className="affirmation">{affirmation}</div>}
                    <a href={`${APP_URL}/capture?mode=calendar`} className="add-btn">+ Add</a>
                </div>

                {/* Right Column (Events) */}
                <div className="right-col">
                    {events && events.length > 0 ? (
                        events.slice(0, 4).map((e, i) => {
                            let timeStr = "All Day";
                            if (!e.isAllDay) {
                                const start = new Date(e.start);
                                const end = new Date(e.end);
                                timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) +
                                    " - " +
                                    end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            }
                            return (
                                <div key={i} className="event">
                                    <div className="event-header">
                                        <div className="bar" />
                                        <a href={e.htmlLink || `${APP_URL}/calendar`} className="title" style={{ color: 'white', textDecoration: 'none' }}>
                                            {e.title}
                                        </a>
                                    </div>
                                    <div className="time">{timeStr}</div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty">No events today</div>
                    )}

                    {events && events.length > 4 && (
                        <div className="more">+ {events.length - 4} more events</div>
                    )}
                </div>

            </div>
        </div>
    );
};
