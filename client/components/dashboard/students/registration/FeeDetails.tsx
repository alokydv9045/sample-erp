"use client";

import { useEffect, useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { StudentRegistrationValues } from "@/lib/validators/student";
import { feeAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, IndianRupee, ChevronDown, ChevronUp } from "lucide-react";

interface FeeDetailsProps {
    form: UseFormReturn<StudentRegistrationValues>;
}

interface FeeStructure {
    id: string;
    name: string;
    description?: string;
    amount: number;
    frequency: string;
    dueDay: number;
    classId?: string;
    isActive: boolean;
}

const FREQUENCY_LABELS: Record<string, string> = {
    ONE_TIME: "One Time",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    YEARLY: "Yearly",
};

const PAYMENT_MODES = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "NET_BANKING", label: "Net Banking" },
    { value: "OTHER", label: "Other" },
];

export default function FeeDetails({ form }: FeeDetailsProps) {
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    const classId = form.watch("classId");
    const selectedIds = form.watch("feeStructureIds") || [];
    const discounts = form.watch("feeDiscounts") || {};
    const initialPayment = form.watch("initialPayment");

    // Fetch fee structures when classId changes
    useEffect(() => {
        const fetchStructures = async () => {
            if (!classId) {
                setStructures([]);
                return;
            }
            try {
                setLoading(true);
                const data = await feeAPI.getStructures({ classId });
                // Also fetch structures with no classId (applies to all)
                const allData = await feeAPI.getStructures({});
                const classStructures = data.feeStructures || data.structures || [];
                const globalStructures = (allData.feeStructures || allData.structures || [])
                    .filter((s: FeeStructure) => !s.classId);

                // Merge and deduplicate
                const merged = [...classStructures];
                for (const gs of globalStructures) {
                    if (!merged.find((m: FeeStructure) => m.id === gs.id)) {
                        merged.push(gs);
                    }
                }
                const finalStructures = merged.filter((s: FeeStructure) => s.isActive !== false);
                setStructures(finalStructures);
                
                // Auto-select ONLY fee structures that explicitly match the classId
                // Do not auto-select global fee structures, let the user manually select them
                const structureIds = finalStructures
                    .filter((s: FeeStructure) => s.classId === classId)
                    .map((s: FeeStructure) => s.id);
                form.setValue("feeStructureIds", structureIds);

            } catch (error) {
                console.error("Failed to fetch fee structures", error);
                setStructures([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStructures();
    }, [classId]);

    // Toggle selection of a fee structure
    const toggleStructure = (structureId: string) => {
        const current = form.watch("feeStructureIds") || [];
        if (current.includes(structureId)) {
            form.setValue(
                "feeStructureIds",
                current.filter((id) => id !== structureId)
            );
            // Clear discount when unselected
            const newDiscounts = { ...discounts };
            delete newDiscounts[structureId];
            form.setValue("feeDiscounts", newDiscounts);
        } else {
            form.setValue("feeStructureIds", [...current, structureId]);
        }
    };

    // Update discount for a structure
    const updateDiscount = (structureId: string, value: number) => {
        const newDiscounts = { ...(discounts || {}) };
        if (value > 0) {
            newDiscounts[structureId] = value;
        } else {
            delete newDiscounts[structureId];
        }
        form.setValue("feeDiscounts", newDiscounts);
    };

    // Computed totals
    const totals = useMemo(() => {
        let totalFee = 0;
        let totalDiscount = 0;

        for (const id of (selectedIds || [])) {
            const structure = structures.find(s => s.id === id);
            if (structure) {
                totalFee += structure.amount;
                totalDiscount += discounts?.[id] || 0;
            }
        }

        return {
            totalFee,
            totalDiscount,
            netPayable: totalFee - totalDiscount,
        };
    }, [selectedIds, discounts, structures]);

    // Intentionally NOT auto-filling initialPayment.amount to totals.netPayable.
    // The Admission Manager should enter the actual amount they collected (partial or full).

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Fee Details
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Select applicable fee structures and optionally record an initial payment. You can skip this step if needed.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Fee Structures List */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading fee structures...</span>
                    </div>
                ) : structures.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed">
                        <IndianRupee className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">
                            {classId
                                ? "No fee structures found for the selected class."
                                : "Please select a class in the Academic tab first."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            You can add fee structures from the Fee Management page.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Available Fee Structures</Label>
                        {structures.map((structure) => {
                            const isSelected = selectedIds?.includes(structure.id);
                            const discount = discounts?.[structure.id] || 0;

                            return (
                                <div
                                    key={structure.id}
                                    onClick={() => toggleStructure(structure.id)}
                                    className={`border rounded-lg p-4 transition-all cursor-pointer ${isSelected
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? "bg-primary border-primary"
                                                : "border-muted-foreground/30"
                                                }`}>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{structure.name}</p>
                                                {structure.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {structure.description}
                                                    </p>
                                                )}
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    {FREQUENCY_LABELS[structure.frequency] || structure.frequency}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm">
                                                ₹{structure.amount.toLocaleString("en-IN")}
                                            </p>
                                            {discount > 0 && (
                                                <p className="text-xs text-green-600">
                                                    -₹{discount.toLocaleString("en-IN")} discount
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Discount input for selected items */}
                                    {isSelected && (
                                        <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-3">
                                                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                                    Discount (₹)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={structure.amount}
                                                    placeholder="0"
                                                    value={discount || ""}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        updateDiscount(structure.id, Math.min(val, structure.amount));
                                                    }}
                                                    className="h-8 w-32 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Totals Summary */}
                {selectedIds && selectedIds.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Fee ({selectedIds.length} item{selectedIds.length > 1 ? "s" : ""})</span>
                            <span>₹{totals.totalFee.toLocaleString("en-IN")}</span>
                        </div>
                        {totals.totalDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Total Discount</span>
                                <span>-₹{totals.totalDiscount.toLocaleString("en-IN")}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                            <span>Net Payable</span>
                            <span>₹{totals.netPayable.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                )}

                {/* Initial Payment Section */}
                {selectedIds && selectedIds.length > 0 && (
                    <div className="border rounded-lg">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
                            onClick={() => setShowPayment(!showPayment)}
                        >
                            <span className="flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Record Initial Payment (Optional)
                            </span>
                            {showPayment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {showPayment && (
                            <div className="px-4 pb-4 space-y-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm">Amount Paid at Admission (₹)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={totals.netPayable}
                                            value={initialPayment?.amount || ""}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                form.setValue("initialPayment", {
                                                    ...initialPayment,
                                                    amount: Math.min(val, totals.netPayable),
                                                });
                                            }}
                                            placeholder="e.g. 2000"
                                        />
                                        {/* Live remaining balance */}
                                        {(initialPayment?.amount || 0) > 0 && (
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-muted-foreground">Remaining Balance:</span>
                                                <span className={`font-semibold ${totals.netPayable - (initialPayment?.amount || 0) === 0
                                                        ? 'text-green-600'
                                                        : 'text-orange-600'
                                                    }`}>
                                                    ₹{Math.max(totals.netPayable - (initialPayment?.amount || 0), 0).toLocaleString("en-IN")}
                                                    {totals.netPayable - (initialPayment?.amount || 0) === 0 && ' ✓ Fully Paid'}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground italic">
                                            Enter the amount collected now. Remaining balance will be tracked in the fee ledger.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm">Payment Mode</Label>
                                        <Select
                                            value={initialPayment?.paymentMode || ""}
                                            onValueChange={(value) => {
                                                form.setValue("initialPayment", {
                                                    ...initialPayment,
                                                    amount: initialPayment?.amount || totals.netPayable,
                                                    paymentMode: value as any,
                                                });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_MODES.map((mode) => (
                                                    <SelectItem key={mode.value} value={mode.value}>
                                                        {mode.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm">Transaction ID</Label>
                                        <Input
                                            placeholder="Optional"
                                            value={initialPayment?.transactionId || ""}
                                            onChange={(e) => {
                                                form.setValue("initialPayment", {
                                                    ...initialPayment,
                                                    amount: initialPayment?.amount || totals.netPayable,
                                                    transactionId: e.target.value,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
