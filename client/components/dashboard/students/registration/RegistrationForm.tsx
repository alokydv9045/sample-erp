"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { studentAPI, enquiryAPI } from "@/lib/api";
import { useEffect } from "react";
import { studentRegistrationSchema, StudentRegistrationValues } from "@/lib/validators/student";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Sub-components will be imported here (creating placeholders for now)
import BasicDetails from "./BasicDetails";
import AcademicDetails from "./AcademicDetails";
import ParentDetails from "./ParentDetails";
import AddressDetails from "./AddressDetails";
import PreviousSchoolDetails from "./PreviousSchoolDetails";
import FeeDetails from "./FeeDetails";
import RegistrationSummary from "./RegistrationSummary";

export default function RegistrationForm() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("basic");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<any>({
        resolver: zodResolver(studentRegistrationSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            dateOfBirth: "",
            gender: "MALE",
            nationality: "Indian",
            admissionDate: new Date().toISOString().split('T')[0],
            classId: "",
            sectionId: "",
            academicYearId: "",
            admissionType: "NEW",
            medium: "ENGLISH",
            fatherName: "",
            fatherPhone: "",
            currentAddress: "",
            city: "",
            state: "",
            pincode: "",
            feeStructureIds: [],
            feeDiscounts: {},
        },
        mode: "onChange",
    });

    const searchParams = useSearchParams();
    const enquiryId = searchParams.get('enquiryId');

    useEffect(() => {
        if (enquiryId) {
            const fetchEnquiry = async () => {
                try {
                    const res = await enquiryAPI.getById(enquiryId);
                    if (res.success && res.enquiry) {
                        const { enquiry } = res;
                        // Split student name if possible, otherwise put in firstName
                        const names = enquiry.studentName.split(' ');
                        const firstName = names[0];
                        const lastName = names.slice(1).join(' ') || '.';

                        form.reset({
                            ...form.getValues(),
                            firstName,
                            lastName,
                            fatherName: enquiry.parentName,
                            fatherPhone: enquiry.phone,
                            email: enquiry.email || "",
                            classId: enquiry.classId,
                            academicYearId: enquiry.academicYearId,
                        });
                        toast.info("Form pre-filled from enquiry data");
                    }
                } catch (err) {
                    
                }
            };
            fetchEnquiry();
        }
    }, [enquiryId, form]);

    const onSubmit = async (data: StudentRegistrationValues) => {
        setIsSubmitting(true);
        try {
            const result = await studentAPI.register(data);
            if (result.success) {
                toast.success("Student registered successfully!");

                // If converted from enquiry, update enquiry status
                if (enquiryId) {
                    await enquiryAPI.update(enquiryId, {
                        status: 'CONVERTED',
                        isConverted: true,
                        convertedAt: new Date().toISOString(),
                        convertedStudentId: result.data.student.id
                    }).catch(console.error);
                }

                router.push(`/dashboard/students/${result.data.student.id}`);
            } else {
                toast.error("Registration failed: " + (result.message || "Unknown error"));
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.response?.data?.error || "Failed to register student");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to validate current step before moving
    const handleNext = async (currentTab: string, nextTab: string, fields: (keyof StudentRegistrationValues)[]) => {
        const output = await form.trigger(fields);
        if (output) {
            setActiveTab(nextTab);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6 items-start relative">
                {/* Navigation Sidebar */}
                <div className="w-64 shrink-0 hidden lg:block sticky top-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Sections</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col space-y-2">
                            <Button type="button" variant="ghost" className="justify-start" onClick={() => document.getElementById("basic")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Basic Info</Button>
                            <Button type="button" variant="ghost" className="justify-start" onClick={() => document.getElementById("academic")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Academic Details</Button>
                            <Button type="button" variant="ghost" className="justify-start" onClick={() => document.getElementById("parents")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Parent Details</Button>
                            <Button type="button" variant="ghost" className="justify-start" onClick={() => document.getElementById("address")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Address</Button>
                            <Button type="button" variant="ghost" className="justify-start" onClick={() => document.getElementById("previous")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Previous School</Button>
                            <Button type="button" variant="ghost" className="justify-start" onClick={() => document.getElementById("fees")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Fee Details</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Form Area */}
                <div className="flex-1 space-y-8 pb-12">
                    <div id="basic" className="scroll-mt-6">
                        <BasicDetails form={form} />
                    </div>
                    
                    <div id="academic" className="scroll-mt-6">
                        <AcademicDetails form={form} />
                    </div>
                    
                    <div id="parents" className="scroll-mt-6">
                        <ParentDetails form={form} />
                    </div>
                    
                    <div id="address" className="scroll-mt-6">
                        <AddressDetails form={form} />
                    </div>
                    
                    <div id="previous" className="scroll-mt-6">
                        <PreviousSchoolDetails form={form} />
                    </div>
                    
                    <div id="fees" className="scroll-mt-6">
                        <FeeDetails form={form} />
                    </div>
                    
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <RegistrationSummary form={form} />
                            <div className="flex justify-end mt-6">
                                <Button type="submit" size="lg" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Registration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
    );
}
