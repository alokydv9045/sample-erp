import { z } from "zod";

export const studentRegistrationSchema = z.object({
    // Basic Details
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    dateOfBirth: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
        message: "Valid date of birth is required",
    }),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
        required_error: "Gender is required",
    }),
    bloodGroup: z.string().optional(),
    photo: z.string().optional(), // Base64 string
    religion: z.string().optional(),
    caste: z.string().optional(),
    nationality: z.string().default("Indian"),

    // Academic Details
    admissionDate: z.string().default(() => new Date().toISOString().split('T')[0]),
    classId: z.string().min(1, "Class is required"),
    sectionId: z.string().min(1, "Section is required"),
    academicYearId: z.string().min(1, "Academic Year is required"),
    admissionType: z.enum(["NEW", "TRANSFER"]).default("NEW"),
    medium: z.enum(["ENGLISH", "HINDI", "OTHER"]).default("ENGLISH"),

    // Previous School (Conditional in UI, but schema can be lax or refined with superRefine)
    previousSchool: z.string().optional(),
    previousClass: z.string().optional(),
    tcNumber: z.string().optional(),
    tcIssueDate: z.string().optional(),
    leavingReason: z.string().optional(),

    // Parent Details
    fatherName: z.string().min(2, "Father's name is required"),
    fatherPhone: z.string().min(10, "Valid phone number is required"),
    fatherOccupation: z.string().optional(),
    fatherEmail: z.string().email("Invalid email").optional().or(z.literal('')),
    fatherAadhaar: z.string().optional(),
    fatherPan: z.string().optional(),

    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
    motherOccupation: z.string().optional(),
    motherAadhaar: z.string().optional(),
    motherPan: z.string().optional(),

    guardianName: z.string().optional(),
    guardianRelation: z.string().optional(),
    guardianPhone: z.string().optional(),

    // Address
    currentAddress: z.string().min(5, "Current address is required"),
    permanentAddress: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Valid Pincode is required"),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),

    // RFID
    rfidCardUid: z.string().optional(),

    // Fee Details (Optional - can be skipped)
    feeStructureIds: z.array(z.string()).optional().default([]),
    feeDiscounts: z.record(z.string(), z.number()).optional().default({}),
    initialPayment: z.object({
        amount: z.number().min(0).optional(),
        paymentMode: z.enum(["CASH", "CHEQUE", "CARD", "UPI", "NET_BANKING", "OTHER"]).optional(),
        transactionId: z.string().optional(),
    }).optional(),
});

export type StudentRegistrationValues = z.infer<typeof studentRegistrationSchema>;
