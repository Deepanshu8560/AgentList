import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, List } from "lucide-react";

export default function AssignmentsView({ assignments, stats }) {
  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList className="bg-white shadow-sm border border-slate-200">
        <TabsTrigger value="all" data-testid="all-assignments-tab">
          <List className="w-4 h-4 mr-2" />
          All Assignments
        </TabsTrigger>
        <TabsTrigger value="stats" data-testid="stats-tab">
          <BarChart className="w-4 h-4 mr-2" />
          Distribution Stats
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk' }}>All Assignments</CardTitle>
            <CardDescription>Complete list of distributed assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <List className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No assignments yet</p>
                <p className="text-sm">Upload a file to create assignments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Agent</TableHead>
                      <TableHead className="font-semibold">First Name</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Notes</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment, index) => (
                      <TableRow key={assignment.id} data-testid={`all-assignment-row-${index}`} className="hover:bg-slate-50">
                        <TableCell className="font-medium" data-testid={`all-assignment-agent-${index}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                              {assignment.agent_name.charAt(0).toUpperCase()}
                            </div>
                            {assignment.agent_name}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`all-assignment-firstname-${index}`}>{assignment.first_name}</TableCell>
                        <TableCell data-testid={`all-assignment-phone-${index}`}>{assignment.phone}</TableCell>
                        <TableCell data-testid={`all-assignment-notes-${index}`}>
                          <span className="max-w-md truncate inline-block">{assignment.notes}</span>
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
      </TabsContent>

      <TabsContent value="stats">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk' }}>Distribution Statistics</CardTitle>
            <CardDescription>Assignments per agent</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BarChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No statistics yet</p>
                <p className="text-sm">Statistics will appear after distributing assignments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div
                    key={stat.agent_id}
                    data-testid={`stat-row-${index}`}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {stat.agent_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800" data-testid={`stat-agent-name-${index}`}>{stat.agent_name}</p>
                        <p className="text-sm text-slate-500">{stat.agent_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600" data-testid={`stat-count-${index}`}>{stat.assignments_count}</p>
                      <p className="text-xs text-slate-500">assignments</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}