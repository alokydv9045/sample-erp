import { forwardRef } from 'react';

export interface ReceiptData {
    receiptNumber: string;
    date: string;
    student: {
        name: string;
        admissionNumber: string;
        class: string;
        section: string;
    };
    payment: {
        amount: number;
        mode: string;
        transactionId?: string;
        feeStructureName: string;
        remarks?: string;
    };
    school?: {
        name: string;
        address: string;
        phone: string;
        email: string;
    };
}

interface ReceiptPrinterProps {
    data: ReceiptData;
}

export const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(
    ({ data }, ref) => {
        const schoolName = data.school?.name || 'EduSphere Academy';
        const schoolAddress = data.school?.address || '123 Education Lane, Knowledge City, 10001';
        const schoolPhone = data.school?.phone || '+1 (555) 123-4567';
        const schoolEmail = data.school?.email || 'billing@edusphere.edu';

        return (
            <div
                ref={ref}
                className="bg-white text-black p-8 w-full max-w-2xl mx-auto rounded-lg shadow-sm font-sans"
                // Ensure this prints well
                style={{ color: '#000', backgroundColor: '#fff' }}
            >
                {/* Header section */}
                <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">{schoolName}</h1>
                    <p className="text-sm text-gray-600 mb-1">{schoolAddress}</p>
                    <p className="text-sm text-gray-600">
                        {schoolPhone} | {schoolEmail}
                    </p>
                    <div className="mt-4 inline-block bg-gray-100 px-4 py-1 rounded shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold uppercase tracking-widest text-gray-800">Fee Receipt</h2>
                    </div>
                </div>

                {/* Receipt Meta */}
                <div className="flex justify-between mb-8 text-sm">
                    <div>
                        <p><span className="font-semibold text-gray-600">Receipt No:</span> <span className="font-mono">{data.receiptNumber}</span></p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold text-gray-600">Date:</span> {data.date}</p>
                    </div>
                </div>

                {/* Student Information */}
                <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 border-b border-gray-200 pb-2">Student Details</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs">Student Name</p>
                            <p className="font-semibold">{data.student.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Admission Number</p>
                            <p className="font-semibold">{data.student.admissionNumber}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Class & Section</p>
                            <p className="font-semibold">{data.student.class} {data.student.section && `- ${data.student.section}`}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Information */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 border-b border-gray-200 pb-2">Payment Details</h3>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y border-gray-200 text-gray-700">
                                <th className="py-2 px-3 font-semibold">Description</th>
                                <th className="py-2 px-3 font-semibold">Payment Mode</th>
                                {data.payment.transactionId && <th className="py-2 px-3 font-semibold">Ref/Txn No</th>}
                                <th className="py-2 px-3 text-right font-semibold">Amount Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-3">
                                    <div className="font-medium">{data.payment.feeStructureName}</div>
                                    {data.payment.remarks && (
                                        <div className="text-xs text-gray-500 mt-1">Note: {data.payment.remarks}</div>
                                    )}
                                </td>
                                <td className="py-3 px-3">{data.payment.mode}</td>
                                {data.payment.transactionId && <td className="py-3 px-3 font-mono text-xs">{data.payment.transactionId}</td>}
                                <td className="py-3 px-3 text-right font-bold text-base">
                                    ₹{data.payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-16 flex justify-between items-end border-t-2 border-dashed border-gray-300 pt-8 text-sm text-gray-600">
                    <div className="italic">
                        This is a computer-generated receipt and does not require a physical signature.
                    </div>
                    <div className="text-center w-40">
                        <div className="border-b border-gray-400 mb-2 h-8"></div>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
            </div>
        );
    }
);
ReceiptPrinter.displayName = 'ReceiptPrinter';
