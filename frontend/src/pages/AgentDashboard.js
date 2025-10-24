import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LogOut, Clipboard, Phone, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AgentDashboard({ user, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(response.data);
    } catch (error) {
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-testid="agent-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk' }}>
              My Assignments
            </h1>
            <p className="text-sm text-slate-500 mt-1">Agent Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700" data-testid="agent-name">{user.name}</p>
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
        {/* Stats Card */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardDescription className="text-blue-100">Total Assignments</CardDescription>
            <CardTitle className="text-5xl font-bold" data-testid="agent-assignments-count">{assignments.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Clipboard className="w-12 h-12 opacity-50" />
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk' }}>Your Assigned Contacts</CardTitle>
            <CardDescription>List of contacts assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Clipboard className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No assignments yet</p>
                <p className="text-sm">You'll see your assigned contacts here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">First Name</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Notes</TableHead>
                      <TableHead className="font-semibold">Assigned Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment, index) => (
                      <TableRow key={assignment.id} data-testid={`assignment-row-${index}`} className="hover:bg-slate-50">
                        <TableCell className="font-medium" data-testid={`assignment-firstname-${index}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {assignment.first_name.charAt(0).toUpperCase()}
                            </div>
                            {assignment.first_name}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`assignment-phone-${index}`}>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {assignment.phone}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`assignment-notes-${index}`}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="max-w-md truncate">{assignment.notes}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}