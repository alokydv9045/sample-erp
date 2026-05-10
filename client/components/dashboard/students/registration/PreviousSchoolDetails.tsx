"use client";

import { UseFormReturn } from "react-hook-form";
import { StudentRegistrationValues } from "@/lib/validators/student";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviousSchoolDetailsProps {
    form: UseFormReturn<StudentRegistrationValues>;
}

export default function PreviousSchoolDetails({ form }: PreviousSchoolDetailsProps) {
    const admissionType = form.watch("admissionType");

    if (admissionType !== "TRANSFER") {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Previous School Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="previousSchool"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>School Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Previous School Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="previousClass"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Previous Class</FormLabel>
                                <FormControl>
                                    <Input placeholder="Class (e.g. 5th)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tcNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transfer Certificate (TC) No.</FormLabel>
                                <FormControl>
                                    <Input placeholder="TC Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tcIssueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>TC Issue Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="leavingReason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason for Leaving</FormLabel>
                                <FormControl>
                                    <Input placeholder="Reason" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

            </CardContent>
        </Card>
    );
}
