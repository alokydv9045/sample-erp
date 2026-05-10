import { useState, useEffect } from 'react';
import { academicAPI } from '@/lib/api';

export function useAcademicData(selectedClassId?: string) {
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch of classes and academic years
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [classesRes, yearsRes] = await Promise.all([
                    academicAPI.getClasses(),
                    academicAPI.getAcademicYears()
                ]);

                setClasses(classesRes.classes || []);
                setAcademicYears(yearsRes.academicYears || []);
            } catch (err: any) {
                console.error("Failed to fetch initial academic data", err);
                setError(err.message || "Failed to load academic data");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch sections whenever selectedClassId changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedClassId) {
                setSections([]);
                return;
            }

            try {
                setLoading(true);
                const sectionsRes = await academicAPI.getSections({ classId: selectedClassId });
                setSections(sectionsRes.sections || []);
            } catch (err: any) {
                console.error("Failed to fetch sections", err);
                setError(err.message || "Failed to load sections");
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [selectedClassId]);

    return {
        classes,
        sections,
        academicYears,
        loading,
        error
    };
}
