'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';

export default function AttendanceReportPage() {
  const [reportType, setReportType] = useState('daily');
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const mockReportData = [
    { date: '2026-02-13', class: 'Grade 10-A', present: 28, absent: 2, percentage: 93.3 },
    { date: '2026-02-12', class: 'Grade 10-A', present: 30, absent: 0, percentage: 100 },
    { date: '2026-02-11', class: 'Grade 10-A', present: 27, absent: 3, percentage: 90 },
    { date: '2026-02-10', class: 'Grade 10-A', present: 29, absent: 1, percentage: 96.7 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
        <p className="text-muted-foreground">View and analyze attendance statistics</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Configure report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Classes</option>
                <option value="10A">Grade 10-A</option>
                <option value="10B">Grade 10-B</option>
                <option value="9A">Grade 9-A</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
              <p className="text-3xl font-bold text-green-600">95.0%</p>
              <p className="mt-2 text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Present</p>
              <p className="text-3xl font-bold">114</p>
              <p className="mt-2 text-xs text-muted-foreground">Out of 120 students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Absent</p>
              <p className="text-3xl font-bold text-red-600">6</p>
              <p className="mt-2 text-xs text-muted-foreground">Across all classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Detailed attendance data for selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Present</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Absent</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {mockReportData.map((record, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-3 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 text-sm">{record.class}</td>
                    <td className="py-3 text-right text-sm font-medium text-green-600">{record.present}</td>
                    <td className="py-3 text-right text-sm font-medium text-red-600">{record.absent}</td>
                    <td className="py-3 text-right">
                      <Badge className={
                        record.percentage >= 95 ? 'bg-green-100 text-green-700' :
                        record.percentage >= 85 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {record.percentage.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
