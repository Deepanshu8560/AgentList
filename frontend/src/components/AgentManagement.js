import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, User } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AgentManagement({ agents, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/agents`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Agent created successfully!");
      setFormData({ name: "", email: "", mobile: "", password: "" });
      setOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Agent deleted successfully!");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete agent");
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk' }}>Agent Management</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Add and manage your agents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-agent-button" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-agent-dialog">
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>Create a new agent account with credentials</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="agent-form">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="agent-name-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="agent-email-input"
                  type="email"
                  placeholder="agent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  data-testid="agent-mobile-input"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  data-testid="agent-password-input"
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" data-testid="submit-agent-button" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Agent"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No agents yet</p>
            <p className="text-sm">Add your first agent to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Mobile</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent, index) => (
                  <TableRow key={agent.id} data-testid={`agent-row-${index}`} className="hover:bg-slate-50">
                    <TableCell className="font-medium" data-testid={`agent-name-${index}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        {agent.name}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`agent-email-${index}`}>{agent.email}</TableCell>
                    <TableCell data-testid={`agent-mobile-${index}`}>{agent.mobile}</TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`delete-agent-${index}`}
                        onClick={() => handleDelete(agent.id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}