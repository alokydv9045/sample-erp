'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Check, FileText, Sparkles } from 'lucide-react';
import { aiAPI } from '@/lib/api/ai';
import { useToast } from '@/hooks/use-toast';

interface SmartAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: { description: string, pdfUrl: string, topic: string }) => void;
  initialData?: {
    subject?: string;
    className?: string;
  };
}

export default function SmartAssignmentModal({ open, onOpenChange, onApply, initialData }: SmartAssignmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  
  const [form, setForm] = useState({
    topic: '',
    referenceText: '',
    complexity: 'Medium',
    questionTypes: {
      mcq: '5',
      oneWord: '5',
      short: '2',
      long: '1',
    }
  });

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!form.topic || !form.referenceText) {
      toast({ title: 'Missing Info', description: 'Please provide a topic and reference notes.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...form,
        subject: initialData?.subject || 'General',
        className: initialData?.className || 'General',
      };
      
      const res = await aiAPI.generateSmartAssignment(payload);
      if (res.success) {
        setGeneratedData(res.data);
        setIsPreview(true);
        toast({ title: 'Generated!', description: 'Your smart assignment is ready for preview.' });
      }
    } catch (err) {
      toast({ title: 'AI Error', description: 'Failed to generate assignment. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedData) {
      onApply({
        description: generatedData.description,
        pdfUrl: generatedData.pdfUrl,
        topic: form.topic
      });
      onOpenChange(false);
      // Reset
      setIsPreview(false);
      setGeneratedData(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Assignment Assistant
          </DialogTitle>
          <DialogDescription>
            Use Gemini 3 to generate a comprehensive assignment based on your notes.
          </DialogDescription>
        </DialogHeader>

        {!isPreview ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="smart-topic">Reference Topic</Label>
              <Input 
                id="smart-topic"
                placeholder="e.g. Photosynthesis, Mughal Empire, Newton's Laws"
                value={form.topic}
                onChange={(e) => setForm({...form, topic: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smart-reference">Reference Material / Source Text</Label>
              <Textarea 
                id="smart-reference"
                placeholder="Paste your chapter summary, notes, or specific lesson text here..."
                className="min-h-[150px]"
                value={form.referenceText}
                onChange={(e) => setForm({...form, referenceText: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground italic">The AI will strictly follow the context provided here.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Complexity</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={form.complexity}
                  onChange={(e) => setForm({...form, complexity: e.target.value})}
                >
                  <option value="Easy">Easy (Grade 1-5 level)</option>
                  <option value="Medium">Medium (Grade 6-10 level)</option>
                  <option value="Hard">Hard (Grade 11-12 level)</option>
                  <option value="Advanced">Advanced (JEE/NEET/Olympiad)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Question Quantities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">MCQs</span>
                  <Input type="number" value={form.questionTypes.mcq} onChange={(e) => setForm({...form, questionTypes: {...form.questionTypes, mcq: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">One Word</span>
                  <Input type="number" value={form.questionTypes.oneWord} onChange={(e) => setForm({...form, questionTypes: {...form.questionTypes, oneWord: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Short</span>
                  <Input type="number" value={form.questionTypes.short} onChange={(e) => setForm({...form, questionTypes: {...form.questionTypes, short: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Long</span>
                  <Input type="number" value={form.questionTypes.long} onChange={(e) => setForm({...form, questionTypes: {...form.questionTypes, long: e.target.value}})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={isLoading} className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Smart Assignment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Check className="h-4 w-4" />
                Preview of Results
              </div>
              <div className="text-sm prose prose-sm max-h-[300px] overflow-y-auto pr-2">
                <p className="whitespace-pre-wrap">{generatedData?.fullContent}</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20 text-xs">
                <FileText className="h-4 w-4 text-primary" />
                <span>EduSphere AI has also generated a **Reference PDF** for students.</span>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t">
              <Button variant="ghost" onClick={() => setIsPreview(false)}>← Back to Edit</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Discard</Button>
                <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700">
                  Apply to Assignment form
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
