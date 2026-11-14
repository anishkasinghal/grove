const DEFAULTS = {
  meta: { lastOpenDate: null },
  tasks: [],
  habits: [],
  habitLogs: [],
  subjects: [],
  semesters: [],
  assignments: [],
  schedule: [],
  studySessions: [],
  activeTimer: null,
  journalPrompts: [
    "What's one thing you're grateful for today?",
    "What's the biggest challenge this week, and one small step forward?",
    "Describe your energy today in a few words — what's driving it?",
    "What did you learn today, in class or otherwise?",
    "What would make today feel like a win?",
    "Who or what supported you today?",
    "What's one thing you'd do differently if you could redo today?",
    "What are you looking forward to this week?"
  ],
  journalEntries: [],
  expenses: [],
  lifeItems: [],
  categories: {
    task: ["Academic", "Personal", "Errands", "Health", "Social"],
    expense: ["Food", "Transport", "Rent", "Subscriptions", "Fun", "Supplies", "Health", "Other"],
    lifeArea: ["Health", "Relationships", "Finance", "Growth", "Home"],
    studyMethod: ["Pomodoro", "Deep Work", "Active Recall", "Reading", "Practice Problems", "Group Study"]
  },
  settings: { name: "there", currency: "$" }
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

module.exports = { DEFAULTS, cloneDefaults };
