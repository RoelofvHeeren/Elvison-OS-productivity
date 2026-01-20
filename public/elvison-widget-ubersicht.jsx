// Elvison OS Dashboard Widget for Übersicht
// ===========================================
// SETUP:
// 1. Install Übersicht (http://tracesof.net/uebersicht/)
// 2. Open Widgets Folder (from Übersicht menu bar icon)
// 3. Move this file into that folder
// 4. Edit the positioning below if needed

// Configuration (API Token is injected automatically on download)
const WIDGET_TOKEN = "WIDGET_TOKEN";
const API_URL = "https://elvison-os-productivity-production.up.railway.app/api/widgets/dashboard";
const API_KEY = "elvison-widget-secret";
const APP_URL = "https://elvison-os-productivity-production.up.railway.app";
const BG_IMAGE = "https://elvison-os-productivity-production.up.railway.app/widget-bg.png";

// Command to fetch data
export const command = `curl -s "${API_URL}?key=${API_KEY}&token=${WIDGET_TOKEN}"`;

// Refresh every hour (in ms)
export const refreshFrequency = 3600000;

// Update state function (optional if default behavior is fine, but good for error handling)
export const updateState = (event, previousState) => {
    if (event.error) {
        return { ...previousState, error: event.error };
    }
    try {
        const data = JSON.parse(event.output);
        return { data };
    } catch (e) {
        return { ...previousState, error: e.toString() };
    }
};

// Styling
export const className = `
  top: 40px;
  left: 40px;
  width: 320px;
  background: transparent; /* Make root container transparent */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
  
  /* Widget Box Styling */
  .elvison-widget {
    background-color: transparent;
    background-image: url('${BG_IMAGE}');
    background-size: 100% 100%; /* Stretch to fit exactly */
    background-position: center;
    /* No border-radius or box-shadow - let the background image define everything */
    overflow: visible;
    position: relative;
    padding: 20px;
  }

  /* Overlay for readability - hidden since image already has dark tint */
  .elvison-overlay {
    display: none;
  }

  .elvison-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h1, h2, h3, p { margin: 0; }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
  }

  .brand { color: #139187; letter-spacing: 0.5px; }
  .date { opacity: 0.9; }

  .greeting {
    font-size: 24px;
    font-weight: 200;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  .buttons {
    display: flex;
    gap: 8px;
  }

  .btn {
    background: rgba(19, 145, 135, 0.3);
    border: 1px solid rgba(19, 145, 135, 0.4);
    color: white;
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .btn:hover { background: rgba(19, 145, 135, 0.5); }

  .stats {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
  }

  .stat-item { display: flex; flex-direction: column; }
  .stat-val { font-size: 24px; font-weight: 700; color: #139187; line-height: 1.1; }
  .stat-label { font-size: 10px; opacity: 0.7; text-transform: uppercase; }

  .tasks-header {
    font-size: 10px;
    opacity: 0.6;
    font-weight: 700;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .task {
    display: flex;
    align-items: center;
    font-size: 12px;
  }
  
  .dot { color: #139187; font-size: 8px; margin-right: 8px; }
  .task-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .task-time { font-size: 10px; opacity: 0.5; margin-left: 8px; }

  .footer {
    font-size: 9px;
    opacity: 0.3;
    text-align: center;
    margin-top: 8px;
  }
`;

// Helper for Greeting
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

// Render Component
export const render = ({ data, error }) => {
    if (error) {
        return (
            <div className="elvison-widget">
                <div className="elvison-overlay" />
                <div className="elvison-content">
                    <div className="header"><span className="brand">Error</span></div>
                    <p style={{ fontSize: '10px', opacity: 0.7 }}>{String(error)}</p>
                    <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '5px' }}>Check configuration or reload.</p>
                </div>
            </div>
        );
    }

    if (!data) return (
        <div className="elvison-widget">
            <div className="elvison-overlay" />
            <div className="elvison-content"><span className="brand">Loading...</span></div>
        </div>
    );

    const { stats, tasks } = data;
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    return (
        <div className="elvison-widget">
            <div className="elvison-overlay" />
            <div className="elvison-content">

                {/* Header */}
                <div className="header">
                    <span className="brand">ELVISON OS</span>
                    <span className="date">{dateStr}</span>
                </div>

                {/* Greeting */}
                <div className="greeting">{getGreeting()}</div>

                {/* Buttons */}
                <div className="buttons">
                    <a href={`${APP_URL}/capture?mode=task`} className="btn">Task</a>
                    <a href={`${APP_URL}/capture?mode=note`} className="btn">Note</a>
                    <a href={`${APP_URL}/capture?mode=reminder`} className="btn">Reminder</a>
                </div>

                {/* Stats */}
                <div className="stats">
                    <div className="stat-item">
                        <span className="stat-val">{stats.tasksRemaining}</span>
                        <span className="stat-label">Tasks Left</span>
                    </div>
                    <div className="stat-item" style={{ alignItems: 'flex-end' }}>
                        <span className="stat-val">{stats.habitsCompleted}/{stats.habitsTotal}</span>
                        <span className="stat-label">Habits</span>
                    </div>
                </div>

                {/* Tasks */}
                <div>
                    <div className="tasks-header">Today's Tasks</div>
                    <div className="task-list">
                        {tasks && tasks.length > 0 ? (
                            tasks.slice(0, 4).map((t, i) => (
                                <div key={i} className="task">
                                    <span className="dot">●</span>
                                    <span className="task-title">{t.title}</span>
                                    {t.dueTime && <span className="task-time">{t.dueTime}</span>}
                                </div>
                            ))
                        ) : (
                            <div className="task" style={{ opacity: 0.5 }}>No tasks for today ✓</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="footer">
                    Updated {today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

            </div>
        </div>
    );
};
