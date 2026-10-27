// ============================================================================
// CONFIGURATION FILE FOR JOB INTERVIEW REGISTRATION APP
// ============================================================================
// You can configure the Google Apps Script Web App URL below once you deploy it.
// Leave as empty string "" until you have generated your Web App URL.
// ============================================================================

const APP_CONFIG = {
  // Paste your deployed Google Apps Script Web App Executable URL here:
  // e.g. "https://script.google.com/macros/s/AKfycbx.../exec"
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwHxWLHm4Gx208Wv6MlNiusGjdu2bgNhzB5ljDQ7-UFt6zDMxtFziRtzxp_7rT9IqqM/exec",

  // Passing years available in the dropdown (2025 to 2029 only)
  PASSING_YEARS: [
    "2025",
    "2026",
    "2027",
    "2028",
    "2029"
  ],

  // Degree options
  DEGREES: [
    "B.E. (Bachelor of Engineering)",
    "B.Tech. (Bachelor of Technology)",
    "B.Sc. (Bachelor of Science)",
    "BCA (Bachelor of Computer Applications)",
    "B.Com. (Bachelor of Commerce)",
    "BBA (Bachelor of Business Administration)",
    "M.E. (Master of Engineering)",
    "M.Tech. (Master of Technology)",
    "MCA (Master of Computer Applications)",
    "M.Sc. (Master of Science)",
    "MBA (Master of Business Administration)",
    "Other"
  ],

  // Department options
  DEPARTMENTS: [
    "Computer Science and Engineering (CSE)",
    "Information Technology (IT)",
    "Artificial Intelligence and Data Science (AI & DS)",
    "Artificial Intelligence and Machine Learning (AI & ML)",
    "Cyber Security",
    "Electronics and Communication Engineering (ECE)",
    "Electrical and Electronics Engineering (EEE)",
    "Mechanical Engineering",
    "Civil Engineering",
    "Computer Applications",
    "Mathematics / Statistics",
    "Commerce / Management",
    "Other"
  ],

  // Arrears options required by prompt:
  // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, More than 10
  ARREARS_OPTIONS: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "More than 10"
  ],

  // Preferred job roles:
  JOB_ROLES: [
    {
      id: "role_process_demo_sale",
      name: "Process Associate – Product Demo and Sale",
      description: "Conduct engaging product demonstrations, customer engagement & client sales workflow."
    },
    {
      id: "role_fullstack_java_python",
      name: "Full Stack Developer – Java / Python",
      description: "Full stack web architectures, modern API services & cloud-native application development."
    },
    {
      id: "role_aiml",
      name: "AI/ML Engineer",
      description: "Machine learning models, LLM architectures, RAG pipelines & data engineering."
    }
  ]
};

// Make config globally accessible
window.APP_CONFIG = APP_CONFIG;
