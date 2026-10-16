import type { ResumeData } from "./pdfBuilder";

/**
 * Single source of truth for the on-page resume document preview.
 * Mirrors Goutham_Resume.pdf (uploaded). The download button serves
 * the static file at /public/Goutham_Resume.pdf — edit preview copy here.
 */
export const resumeData: ResumeData = {
  name: "Goparaju Goutham Sai",
  role: "Data Management Analyst - Governance, Pipelines & Quality",
  status: "PDF / Live Compile",
  contact: [
    { label: "EMAIL", value: "gouthamsaigoparaju@gmail.com" },
    { label: "GITHUB", value: "github.com/Goutham011" },
    { label: "LINKEDIN", value: "linkedin.com/in/goutham-sai-goparaju-574555262" },
  ],
  profile: [
    "Data Management Analyst specializing in Data Governance, Data Quality,",
    "and scalable ETL / data pipelines engineered for reliable insights at scale.",
    "Hands-on with Python, SQL, BigQuery and Airflow - from collection to reporting.",
  ],
  skills: [
    {
      group: "Languages & Core",
      items: ["Python", "SQL", "C++", "C", "JavaScript", "HTML", "CSS", "PHP", "C#"],
    },
    {
      group: "Big Data & Pipelines",
      items: ["ETL", "Data Pipelines", "Apache Spark", "Kafka", "Hadoop", "Airflow"],
    },
    {
      group: "Data & Analysis",
      items: [
        "Data Management",
        "Data Governance",
        "Data Quality",
        "Data Collection",
        "Data Preparation",
        "Statistics",
        "Insights Generation",
      ],
    },
    {
      group: "Databases & Visualization",
      items: ["BigQuery", "MongoDB", "Excel", "Power BI", "Looker"],
    },
    {
      group: "Frameworks & Methodologies",
      items: ["Docker", "Git/GitHub", "Agile", "CI/CD", "Automation", "Process Improvement"],
    },
  ],
  work: [
    {
      name: "Interactive Virtual Surgery Agent - NIT Trichy",
      period: "Jan 2025 - Apr 2025",
      desc: [
        "VR simulation with automated data collection handling 10,000+ daily",
        "records; governance protocols with medical experts, +35% engagement.",
      ],
      tags: "UNITY // VR // C# // DATA COLLECTION",
    },
    {
      name: "Full-Stack Developer Intern - Web Stack Academy",
      period: "Jun 2024 - Jul 2024",
      desc: [
        "React Native services with CI/CD automation (+30% build efficiency);",
        "data-managed workflows for 1,000+ DAU at 99.2% crash-free sessions.",
      ],
      tags: "REACT NATIVE // DEVOPS // CI/CD",
    },
    {
      name: "Autonomous Driving System",
      period: "Nov 2025",
      desc: [
        "YOLOv3 traffic-light detection (92%) + drowsiness monitoring; Spark +",
        "Kafka streaming pipelines at 30+ FPS over 50+ hours of video.",
      ],
      tags: "PYTHON // OPENCV // PYTORCH // YOLOV3 // SPARK // KAFKA",
    },
    {
      name: "BankTerm (Machine Learning)",
      period: "Mar 2024",
      desc: [
        "XGBoost models at 85.89% accuracy with SMOTE (+17% recall); Airflow +",
        "BigQuery workflows governing 100,000+ customer records.",
      ],
      tags: "PYTHON // XGBOOST // AIRFLOW // BIGQUERY",
    },
  ],
  stats: [
    { value: "10K+", label: "daily records handled" },
    { value: "99.9%", label: "system stability" },
    { value: "85.89%", label: "model accuracy" },
    { value: "100K+", label: "customer records" },
  ],
};
