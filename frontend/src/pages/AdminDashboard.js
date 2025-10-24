import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Users, Upload, BarChart3 } from "lucide-react";
import AgentManagement from "@/components/AgentManagement";
import UploadSection from "@/components/UploadSection";
import AssignmentsView from "@/components/AssignmentsView";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, onLogout }) {
  const [agents, setAgents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState([]);
  const [activeTab, setActiveTab] = useState("agents");

  useEffect(() => {
    fetchAgents();
    fetchAssignments();
    fetchStats();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(response.data);
    } catch (error) {
      toast.error("Failed to fetch agents");
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(response.data);
    } catch (error) {
      toast.error("Failed to fetch assignments");
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/assignments/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  };

  const handleUploadSuccess = () => {
    fetchAssignments();
    fetchStats();
    setActiveTab("assignments");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk' }}>
              Distribution Manager
            </h1>
            <p className="text-sm text-slate-500 mt-1">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700" data-testid="admin-name">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              data-testid="logout-button"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-100">Total Agents</CardDescription>
              <CardTitle className="text-4xl font-bold" data-testid="total-agents-count">{agents.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="w-8 h-8 opacity-50" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-purple-100">Total Assignments</CardDescription>
              <CardTitle className="text-4xl font-bold" data-testid="total-assignments-count">{assignments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart3 className="w-8 h-8 opacity-50" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-100">Avg per Agent</CardDescription>
              <CardTitle className="text-4xl font-bold" data-testid="avg-assignments-count">
                {agents.length > 0 ? Math.round(assignments.length / agents.length) : 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Upload className="w-8 h-8 opacity-50" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-slate-200 p-1">
            <TabsTrigger value="agents" data-testid="agents-tab" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="upload" data-testid="upload-tab" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Upload className="w-4 h-4 mr-2" />
              Upload & Distribute
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="assignments-tab" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            <AgentManagement agents={agents} onRefresh={fetchAgents} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <UploadSection onSuccess={handleUploadSuccess} agents={agents} />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <AssignmentsView assignments={assignments} stats={stats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}