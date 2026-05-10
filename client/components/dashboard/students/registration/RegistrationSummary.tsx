"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { StudentRegistrationValues } from "@/lib/validators/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { academicAPI, feeAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface RegistrationSummaryProps {
    form: UseFormReturn<StudentRegistrationValues>;
}

interface FeeStructureInfo {
    id: string;
    name: string;
    amount: number;
    frequency: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
    ONE_TIME: "One Time",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    YEARLY: "Yearly",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    CHEQUE: "Cheque",
    NET_BANKING: "Net Banking",
    OTHER: "Other",
};

export default function RegistrationSummary({ form }: RegistrationSummaryProps) {
    const values = form.watch();
    const [className, setClassName] = useState<string>("");
    const [sectionName, setSectionName] = useState<string>("");
    const [academicYearName, setAcademicYearName] = useState<string>("");
    const [feeStructures, setFeeStructures] = useState<FeeStructureInfo[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                if (values.classId) {
                    const classesData = await academicAPI.getClasses();
                    const selectedClass = classesData.classes?.find((c: any) => c.id === values.classId);
                    if (selectedClass) setClassName(selectedClass.name);
                }

                if (values.classId && values.sectionId) {
                    const sectionsData = await academicAPI.getSections({ classId: values.classId });
                    const selectedSection = sectionsData.sections?.find((s: any) => s.id === values.sectionId);
                    if (selectedSection) setSectionName(selectedSection.name);
                }

                if (values.academicYearId) {
                    const yearsData = await academicAPI.getAcademicYears();
                    const selectedYear = yearsData.years?.find((y: any) => y.id === values.academicYearId);
                    if (selectedYear) setAcademicYearName(selectedYear.name);
                }

                if (values.feeStructureIds && values.feeStructureIds.length > 0) {
                    const data = await feeAPI.getStructures({});
                    const allStructures = data.feeStructures || data.structures || [];
                    const selected = allStructures.filter((s: any) => values.feeStructureIds?.includes(s.id));
                    setFeeStructures(selected);
                }
            } catch (error) {
                console.error("Failed to fetch metadata for summary", error);
            }
        };

        fetchMetadata();
    }, [values.classId, values.sectionId, values.academicYearId, values.feeStructureIds]);

    const feeTotals = (() => {
        let totalFee = 0;
        let totalDiscount = 0;
        for (const s of feeStructures) {
            totalFee += s.amount;
            totalDiscount += values.feeDiscounts?.[s.id] || 0;
        }
        return { totalFee, totalDiscount, netPayable: totalFee - totalDiscount };
    })();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Review Registration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Basic Info */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        {values.photo && (
                            <div className="flex-shrink-0">
                                <Avatar className="h-24 w-24 border">
                                    <AvatarImage src={values.photo} alt="Student Photo" className="object-cover" />
                                    <AvatarFallback className="text-xl">
                                        {values.firstName?.[0]}{values.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        )}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">First Name</span>
                                <span className="font-medium">{values.firstName}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Last Name</span>
                                <span className="font-medium">{values.lastName}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Date of Birth</span>
                                <span className="font-medium">{values.dateOfBirth?.toString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Gender</span>
                                <span className="font-medium">{values.gender}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Blood Group</span>
                                <span className="font-medium">{values.bloodGroup || "-"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Nationality</span>
                                <span className="font-medium">{values.nationality}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Religion</span>
                                <span className="font-medium">{values.religion || "-"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Caste</span>
                                <span className="font-medium">{values.caste || "-"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="my-4" />

                {/* Academic Info */}
                <div>
                    <h3 className="text-lg font-medium mb-2">Academic Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block">Academic Year</span>
                            <span className="font-medium">{academicYearName || values.academicYearId}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Admission Type</span>
                            <span className="font-medium">{values.admissionType}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Medium</span>
                            <span className="font-medium">{values.medium}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Class</span>
                            <span className="font-medium">{className || values.classId}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Section</span>
                            <span className="font-medium">{sectionName || values.sectionId}</span>
                        </div>
                    </div>
                </div>

                <hr className="my-4" />

                {/* Parent Info */}
                <div>
                    <h3 className="text-lg font-medium mb-2">Parent Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block">Father&apos;s Name</span>
                            <span className="font-medium">{values.fatherName}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Father&apos;s Phone</span>
                            <span className="font-medium">{values.fatherPhone}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Mother&apos;s Name</span>
                            <span className="font-medium">{values.motherName || "-"}</span>
                        </div>
                    </div>
                </div>

                <hr className="my-4" />

                {/* Address */}
                <div>
                    <h3 className="text-lg font-medium mb-2">Address</h3>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block">Current Address</span>
                            <span className="font-medium">{values.currentAddress}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">City/State/Pin</span>
                            <span className="font-medium">{values.city}, {values.state} - {values.pincode}</span>
                        </div>
                    </div>
                </div>

                {values.previousSchool && (
                    <>
                        <hr className="my-4" />
                        <div>
                            <h3 className="text-lg font-medium mb-2">Previous School</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">School Name</span>
                                    <span className="font-medium">{values.previousSchool}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Previous Class</span>
                                    <span className="font-medium">{values.previousClass}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Fee Details */}
                {feeStructures.length > 0 && (
                    <>
                        <hr className="my-4" />
                        <div>
                            <h3 className="text-lg font-medium mb-2">Fee Details</h3>
                            <div className="space-y-3">
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left p-2 font-medium">Fee Structure</th>
                                                <th className="text-left p-2 font-medium">Frequency</th>
                                                <th className="text-right p-2 font-medium">Amount</th>
                                                <th className="text-right p-2 font-medium">Discount</th>
                                                <th className="text-right p-2 font-medium">Net</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feeStructures.map((s) => {
                                                const discount = values.feeDiscounts?.[s.id] || 0;
                                                return (
                                                    <tr key={s.id} className="border-t">
                                                        <td className="p-2">{s.name}</td>
                                                        <td className="p-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {FREQUENCY_LABELS[s.frequency] || s.frequency}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2 text-right">₹{s.amount.toLocaleString("en-IN")}</td>
                                                        <td className="p-2 text-right text-green-600">
                                                            {discount > 0 ? `-₹${discount.toLocaleString("en-IN")}` : "-"}
                                                        </td>
                                                        <td className="p-2 text-right font-medium">
                                                            ₹{(s.amount - discount).toLocaleString("en-IN")}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="border-t bg-muted/30">
                                            <tr>
                                                <td colSpan={4} className="p-2 font-semibold text-right">Total Payable</td>
                                                <td className="p-2 text-right font-semibold">
                                                    ₹{feeTotals.netPayable.toLocaleString("en-IN")}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {values.initialPayment?.amount && values.initialPayment.amount > 0 && (
                                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                                            Initial Payment
                                        </p>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground block">Amount</span>
                                                <span className="font-medium">₹{values.initialPayment.amount.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Mode</span>
                                                <span className="font-medium">
                                                    {PAYMENT_MODE_LABELS[values.initialPayment.paymentMode || ""] || "-"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Transaction ID</span>
                                                <span className="font-medium">{values.initialPayment.transactionId || "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

            </CardContent>
        </Card>
    );
}
