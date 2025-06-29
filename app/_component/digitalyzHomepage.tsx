"use client";
import { useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Slider,
  Typography,
  Input,
  TextField,
} from "@mui/material";
import Sidebar from "@/app/_component/sidebar";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

export default function DataAlchemistUI() {
  const [data, setData] = useState<{ [key: string]: any[] }>({});
  const [selectedType, setSelectedType] = useState<"clients" | "workers" | "tasks">("clients");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [weights, setWeights] = useState({
    priorityWeight: 50,
    fairnessWeight: 30,
    workloadWeight: 20,
  });
  const [loading, setLoading] = useState(false);
  const [customRuleText, setCustomRuleText] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchScope, setSearchScope] = useState<"clients" | "workers" | "tasks" | "all">("clients");

  const callAI = async (type: string, message: string, dataPayload: any[] = []) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai_analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, data: dataPayload, weights }),
      });

      const json = await res.json();
      setLoading(false);

      if (json?.result) return json.result;
      console.error("Error:", json.error);
      return [];
    } catch (err) {
      setLoading(false);
      console.error("AI Error:", err);
      return [];
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (evt) => {
      const binary = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(binary, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const cleanedData = json.filter((row) => Object.values(row).some((v) => v !== ""));
      if (cleanedData.length === 0) return alert("Uploaded sheet is empty.");

      setData((prev) => ({ ...prev, [selectedType]: cleanedData }));

      const errors = await callAI("validate", "", cleanedData);
      setValidationErrors(errors);
    };

    reader.readAsArrayBuffer(file);
  };

  const getColumns = (rows: any[]): GridColDef[] =>
    rows.length > 0
      ? Object.keys(rows[0]).map((field) => ({
          field,
          headerName: field,
          width: 150,
          editable: true,
        }))
      : [];

  const handleSuggestRules = async () => {
    const rules = await callAI("suggest", "", data[selectedType] || []);
    setRules(rules);
  };

  const handleCustomRule = async () => {
    const rule = await callAI("rule", customRuleText, data[selectedType] || []);
    setRules((prev) => [...prev, rule]);
    setCustomRuleText("");
  };

  const exportCSV = (entity: string) => {
    const ws = XLSX.utils.json_to_sheet(data[entity]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, entity);
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${entity}.xlsx`);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify({ data, rules, prioritization: weights }, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "data-alchemist-export.json");
  };

  const handleNaturalSearch = async () => {
    const dataToSearch =
      searchScope === "all"
        ? [...(data.clients || []), ...(data.workers || []), ...(data.tasks || [])]
        : data[searchScope] || [];

    if (!searchQuery || dataToSearch.length === 0) return alert("No data available to search.");
    setIsSearching(true);
    const result = await callAI("query", searchQuery, dataToSearch);

    try {
      if (!Array.isArray(result)) throw new Error("Invalid response format");
      setSearchResults(result);
    } catch (error) {
      alert("AI returned an invalid response.");
      console.error("AI query response error:", result);
    }

    setIsSearching(false);
  };

  const exportSearchResults = () => {
    if (searchResults.length === 0) return alert("No search results to export.");
    const ws = XLSX.utils.json_to_sheet(searchResults);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SearchResults");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `SearchResults_${searchScope}.xlsx`);
  };

  const pieData = Object.entries(weights).map(([key, value]) => ({
    name: key.replace("Weight", ""),
    value,
  }));
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 flex flex-col">
        <header className="sticky top-0 bg-white/60 backdrop-blur-md shadow z-10 p-4 h-16">
        </header>
        <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl fullWidth>
              <InputLabel id="file-type-label" className=" mt-[-8px]">File Type</InputLabel>
              <Select
                labelId="file-type-label"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="bg-white"
              >
                <MenuItem value="clients">Clients</MenuItem>
                <MenuItem value="workers">Workers</MenuItem>
                <MenuItem value="tasks">Tasks</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" component="label" fullWidth>
              Upload Excel/CSV
              <Input type="file" hidden onChange={handleFileUpload} />
            </Button>
          </div>
          <div className="bg-white p-4 rounded shadow space-y-4">
            <Typography variant="h6" className="text-blue-700">Search</Typography>
            <div className="flex flex-col sm:flex-row gap-4">
              <TextField
                label={`Search in ${searchScope}`}
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel id="search" className=" mt-[-7px]">Search In</InputLabel>
                <Select
                  labelId="search"
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value as any)}
                >
                  <MenuItem value="clients">Clients</MenuItem>
                  <MenuItem value="workers">Workers</MenuItem>
                  <MenuItem value="tasks">Tasks</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
              <Button
                onClick={handleNaturalSearch}
                variant="contained"
                disabled={isSearching || !searchQuery}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="bg-blue-50 p-4 rounded shadow border">
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle1" className="font-semibold text-blue-800">
                    Search Results
                  </Typography>
                  <Button onClick={exportSearchResults} size="small" variant="outlined">
                    Export Results
                  </Button>
                </div>
                <DataGrid
                  rows={searchResults.map((row, i) => ({ id: i, ...row }))}
                  columns={getColumns(searchResults)}
                  autoHeight
                  pageSizeOptions={[5, 10]}
                />
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md shadow">
              <strong>Validation Errors:</strong>
              <ul className="list-disc pl-5 mt-2">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Grid */}
          {Object.entries(data).map(([type, rows]) =>
            rows.length > 0 ? (
              <div key={type} className="bg-white p-4 rounded-xl shadow overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-700">{type} Data</h3>
                  <Button variant="outlined" size="small" onClick={() => exportCSV(type)}>Export {type}.xlsx</Button>
                </div>
                <DataGrid
                  rows={rows.map((row, i) => ({ id: i, ...row }))}
                  columns={getColumns(rows)}
                  autoHeight
                  pageSizeOptions={[5, 10]}
                />
              </div>
            ) : null
          )}

          {/* Rules */}
          <div className="space-y-4">
            <Typography variant="h6" className="text-blue-700">Suggest Rules</Typography>
            <Button onClick={handleSuggestRules} variant="contained" disabled={loading}>
              {loading ? "Loading..." : "Suggest Rules via AI"}
            </Button>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <TextField
                label="Custom Rule Description"
                variant="outlined"
                fullWidth
                value={customRuleText}
                onChange={(e) => setCustomRuleText(e.target.value)}
              />
              <Button variant="outlined" onClick={handleCustomRule} disabled={loading || !customRuleText}>
                Generate Rule
              </Button>
            </div>

            {rules.length > 0 && (
              <div className="bg-white p-4 rounded shadow border border-blue-200">
                <h4 className="font-semibold text-blue-700 mb-2">Generated Rules:</h4>
                <pre className="text-sm text-black whitespace-pre-wrap p-2 rounded max-h-60 overflow-y-auto">
                  {JSON.stringify(rules, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Weights */}
          <div className="bg-white p-4 rounded shadow space-y-6">
            <Typography variant="h6" className="text-blue-700">Prioritization Weights</Typography>
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <Typography gutterBottom className="capitalize font-medium text-black">{key.replace("Weight", " Weight")}</Typography>
                <Slider
                  value={value}
                  onChange={(e, val) => setWeights((prev) => ({ ...prev, [key]: val as number }))}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </div>
            ))}

            <div className="flex flex-wrap gap-4">
              <Button variant="outlined"  onClick={() => setWeights({ priorityWeight: 80, fairnessWeight: 10, workloadWeight: 10 })}>
                Maximize Priority
              </Button>
              <Button variant="outlined" onClick={() => setWeights({ priorityWeight: 33, fairnessWeight: 33, workloadWeight: 34 })}>
                Fair Distribution
              </Button>
              <Button variant="outlined" onClick={() => setWeights({ priorityWeight: 20, fairnessWeight: 10, workloadWeight: 70 })}>
                Minimize Workload
              </Button>
            </div>

            <Button onClick={handleExportAll} variant="outlined">Export All as JSON</Button>

            <div className="mt-6 h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
