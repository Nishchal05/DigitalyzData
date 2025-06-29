DigitalyzData – Smart Data Cleaning & Rule Engine with AI
DigitalyzData is an AI-powered data validation and rule-generation tool built with Next.js, TypeScript, Material UI, and OpenRouter AI (via OpenAI-compatible API).
It enables you to:

🧼 Upload .xlsx / .csv files (Clients, Workers, Tasks)<br/>
🤖 Automatically validate data using AI<br/>
📋 Generate business rules from natural language<br/>
🧠 Suggest rules from existing datasets<br/>
🔍 Filter datasets via natural language query<br/>
⚖️ Assign prioritization weights and visualize them via pie chart<br/>
📦 Export cleaned data, rules, and weights as .json or .xlsx<br/>
🚀 Tech Stack
Frontend: Next.js 14+, App Router, TypeScript, TailwindCSS + Material UI
AI Backend: OpenRouter API (openai.chat.completions.create)
Visualization: Recharts for pie charts
UI Table: MUI DataGrid
File Upload/Export: XLSX + file-saver
🛠️ Getting Started Locally
✅ Prerequisites: Node.js ≥ 18, npm, internet connection

1. Clone the repo
bash
Copy
Edit
git clone https://github.com/nishchal05/digitalyzdata.git
cd data-alchemist
2. Install dependencies
bash
Copy
Edit
npm install
3. Add .env.local
Create a file named .env.local in the root directory with the following:
env
Copy
Edit
API_KEY=sk-your-openrouter-api-key-here
MODEL=mistralai/mistral-small-3.2-24b-instruct:free
💡 You can get your API key from https://openrouter.ai/keys
4. Run the app
bash
Copy
Edit
npm run dev
Visit http://localhost:3000
Your app should now be running!
