'use client';

import {useState, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {HandoverGuard} from '@/components/permission-guard';
import {
  useHandoverFormData,
  useCreateHandover,
} from '@/hooks/use-production-runs';
import type {ShiftHandoverIssue} from '@/types/production-run';

export default function ShiftHandoverPage() {
  const router = useRouter();
  const t = useTranslations('productionRuns');

  const {data: formData, isLoading} = useHandoverFormData();
  const createHandover = useCreateHandover();

  const [fromShift, setFromShift] = useState<string>('');
  const [toShift, setToShift] = useState<string>('');
  const [pendingTasks, setPendingTasks] = useState<string[]>(['']);
  const [issues, setIssues] = useState<ShiftHandoverIssue[]>([]);
  const [notes, setNotes] = useState('');

  // Set default values when form data loads
  useEffect(() => {
    if (formData?.current_shift && !fromShift) {
      setFromShift(formData.current_shift.name);
    }
    if (formData?.next_shift && !toShift) {
      setToShift(formData.next_shift.name);
    }
  }, [formData, fromShift, toShift]);

  const addPendingTask = () => {
    setPendingTasks([...pendingTasks, '']);
  };

  const updatePendingTask = (index: number, value: string) => {
    const updated = [...pendingTasks];
    updated[index] = value;
    setPendingTasks(updated);
  };

  const removePendingTask = (index: number) => {
    setPendingTasks(pendingTasks.filter((_, i) => i !== index));
  };

  const addIssue = () => {
    setIssues([...issues, {type: '', description: '', severity: 'low'}]);
  };

  const updateIssue = (
    index: number,
    field: keyof ShiftHandoverIssue,
    value: string
  ) => {
    const updated = [...issues];
    updated[index] = {...updated[index], [field]: value};
    setIssues(updated);
  };

  const removeIssue = (index: number) => {
    setIssues(issues.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!fromShift || !toShift) return;

    const filteredTasks = pendingTasks.filter((task) => task.trim() !== '');
    const filteredIssues = issues.filter(
      (issue) => issue.type.trim() !== '' && issue.description.trim() !== ''
    );

    await createHandover.mutateAsync({
      from_shift: fromShift,
      to_shift: toShift,
      pending_tasks: filteredTasks.length > 0 ? filteredTasks : undefined,
      issues: filteredIssues.length > 0 ? filteredIssues : undefined,
      notes: notes.trim() || undefined,
    });

    router.push('/production-runs');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <HandoverGuard>
      <div className="container mx-auto space-y-6 p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('shift.shiftHandover')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('handover.subtitle')}
            </p>
          </div>
        </div>

        {/* Shift Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRightLeft className="size-5 text-purple-600" />
              {t('handover.shiftDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('handover.fromShift')}</Label>
                <Select value={fromShift} onValueChange={setFromShift}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('handover.selectShift')} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData?.shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{backgroundColor: shift.color}}
                          />
                          {shift.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('handover.toShift')}</Label>
                <Select value={toShift} onValueChange={setToShift}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('handover.selectShift')} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData?.shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{backgroundColor: shift.color}}
                          />
                          {shift.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {t('handover.pendingTasks')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addPendingTask}>
                <Plus className="mr-1 size-4" />
                {t('handover.add')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('handover.noPendingTasks')}
              </p>
            ) : (
              pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={task}
                    onChange={(e) => updatePendingTask(index, e.target.value)}
                    placeholder={t('handover.taskPlaceholder')}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePendingTask(index)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Issues */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="size-5 text-amber-600" />
                {t('handover.issues')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addIssue}>
                <Plus className="mr-1 size-4" />
                {t('handover.add')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {issues.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('handover.noIssues')}
              </p>
            ) : (
              issues.map((issue, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={issue.type}
                        onChange={(e) =>
                          updateIssue(index, 'type', e.target.value)
                        }
                        placeholder={t('handover.issueTypePlaceholder')}
                        className="w-40"
                      />
                      <Select
                        value={issue.severity}
                        onValueChange={(v) => updateIssue(index, 'severity', v)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <Badge variant="secondary">
                              {t('handover.severityLow')}
                            </Badge>
                          </SelectItem>
                          <SelectItem value="medium">
                            <Badge className="bg-amber-100 text-amber-700">
                              {t('handover.severityMedium')}
                            </Badge>
                          </SelectItem>
                          <SelectItem value="high">
                            <Badge variant="destructive">
                              {t('handover.severityHigh')}
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIssue(index)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={issue.description}
                    onChange={(e) =>
                      updateIssue(index, 'description', e.target.value)
                    }
                    placeholder={t('handover.issueDescriptionPlaceholder')}
                    rows={2}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {t('handover.additionalNotes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('handover.notesPlaceholder')}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!fromShift || !toShift || createHandover.isPending}
        >
          {createHandover.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('handover.submitting')}
            </>
          ) : (
            <>
              <ArrowRightLeft className="mr-2 size-4" />
              {t('handover.submitButton')}
            </>
          )}
        </Button>
      </div>
    </HandoverGuard>
  );
}
