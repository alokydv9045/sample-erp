import { Metadata } from "next";
import { Suspense } from "react";
import RegistrationForm from "@/components/dashboard/students/registration/RegistrationForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Register Student | EduSphere",
    description: "Register a new student",
};

export default function RegisterStudentPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Student Registration</h2>
                    <p className="text-muted-foreground">
                        Register a new student, assign class, and generate credentials.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading registration form...</span>
                </div>
            }>
                <RegistrationForm />
            </Suspense>
        </div>
    );
}
