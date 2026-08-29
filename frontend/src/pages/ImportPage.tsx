import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Upload, ArrowRight, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import FileUploader from '@/components/ui/FileUploader';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { importApi, ImportAnalysisResponse, ConfirmImportResponse } from '@/api/import';

type Step = 'upload' | 'mapping' | 'preview' | 'success';

export default function ImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysisResponse | null>(null);
  const [importResult, setImportResult] = useState<ConfirmImportResponse | null>(null);

  // Mapping state
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [phoneCol, setPhoneCol] = useState<string>('');
  const [nameCol, setNameCol] = useState<string>('');
  const [emailCol, setEmailCol] = useState<string>('');
  const [country, setCountry] = useState('PK');

  const uploadMutation = useMutation({
    mutationFn: (f: File) => importApi.uploadFile(f),
    onSuccess: (data) => {
      setAnalysis(data);
      setSelectedSheet(data.sheets[0] || '');
      setPhoneCol(data.detectedColumns.phoneColumn || '');
      setNameCol(data.detectedColumns.nameColumn || '');
      setEmailCol(data.detectedColumns.emailColumn || '');
      setStep('mapping');
      toast.success('File analyzed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload file');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => importApi.confirmImport({
      fileId: analysis!.fileId,
      sheetName: selectedSheet,
      phoneColumn: phoneCol,
      nameColumn: nameCol || undefined,
      emailColumn: emailCol || undefined,
      defaultCountry: country,
    }),
    onSuccess: (data) => {
      setImportResult(data);
      setStep('success');
      toast.success(`Imported ${data.importedCount} contacts`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import contacts');
    },
  });

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleConfirm = () => {
    if (!phoneCol) {
      toast.error('Phone column is required');
      return;
    }
    confirmMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Contacts</h1>
        <p className="text-gray-500 dark:text-gray-400">Upload Excel or CSV files to add contacts in bulk.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
        {[
          { id: 'upload', label: '1. Upload' },
          { id: 'mapping', label: '2. Map Columns' },
          { id: 'preview', label: '3. Preview & Import' },
          { id: 'success', label: '4. Done' },
        ].map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm
              ${step === s.id ? 'bg-primary-600 text-white' : 
                ['upload', 'mapping', 'preview', 'success'].indexOf(step) > idx 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
            >
              {['upload', 'mapping', 'preview', 'success'].indexOf(step) > idx ? <CheckCircle2 size={16} /> : idx + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${step === s.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {s.label}
            </span>
            {idx < 3 && <div className="w-12 border-t-2 border-gray-200 dark:border-gray-700 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <Card className="p-8">
          <FileUploader 
            onFileSelect={setFile} 
            maxSizeMB={10} 
            accept=".xlsx,.xls,.csv" 
          />
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploadMutation.isPending}
              isLoading={uploadMutation.isPending}
              rightIcon={<ArrowRight size={18} />}
            >
              Analyze File
            </Button>
          </div>
        </Card>
      )}

      {step === 'mapping' && analysis && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6 dark:text-white">Map Data Columns</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <Select 
                label="Select Worksheet" 
                value={selectedSheet} 
                onChange={(e) => setSelectedSheet(e.target.value)}
                options={analysis.sheets.map(sheet => ({ label: sheet, value: sheet }))}
              />
              
              <div>
                <Select 
                  label="Default Country Code" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)}
                  options={[
                    { label: 'Pakistan (+92)', value: 'PK' },
                    { label: 'India (+91)', value: 'IN' },
                    { label: 'United States (+1)', value: 'US' },
                    { label: 'United Kingdom (+44)', value: 'UK' },
                    { label: 'UAE (+971)', value: 'AE' }
                  ]}
                />
                <p className="mt-1 text-xs text-gray-500">Used if numbers don't start with a country code (+)</p>
              </div>
            </div>
            
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <Select 
                label="Phone Number Column *" 
                value={phoneCol} 
                onChange={(e) => setPhoneCol(e.target.value)}
                error={!phoneCol ? "Required" : undefined}
                placeholder="-- Select Column --"
                options={analysis.headers.map(h => ({ label: h, value: h }))}
              />
              
              <Select 
                label="Name Column (Optional)" 
                value={nameCol} 
                onChange={(e) => setNameCol(e.target.value)}
                placeholder="-- Ignore --"
                options={analysis.headers.map(h => ({ label: h, value: h }))}
              />

              <Select 
                label="Email Column (Optional)" 
                value={emailCol} 
                onChange={(e) => setEmailCol(e.target.value)}
                placeholder="-- Ignore --"
                options={analysis.headers.map(h => ({ label: h, value: h }))}
              />
            </div>
          </div>

          <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
            <Button 
              onClick={() => setStep('preview')} 
              disabled={!phoneCol}
              rightIcon={<ArrowRight size={18} />}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 'preview' && analysis && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2 dark:text-white">Review & Confirm</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            You are about to import contacts from <strong>{analysis.originalFileName}</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sheet</p>
              <p className="font-medium dark:text-white">{selectedSheet}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone Column</p>
              <p className="font-medium dark:text-white">{phoneCol}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Other Fields</p>
              <p className="font-medium dark:text-white">
                {[nameCol ? 'Name' : null, emailCol ? 'Email' : null].filter(Boolean).join(', ') || 'None'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex items-start mb-8">
            <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium">Import Processing</p>
              <p className="text-sm mt-1">
                The system will automatically validate numbers and remove duplicates based on existing contacts. 
                Invalid numbers will be skipped and reported back to you.
              </p>
            </div>
          </div>

          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button variant="outline" onClick={() => setStep('mapping')} disabled={confirmMutation.isPending}>Back</Button>
            <Button 
              onClick={handleConfirm} 
              isLoading={confirmMutation.isPending}
              disabled={confirmMutation.isPending}
            >
              Start Import
            </Button>
          </div>
        </Card>
      )}

      {step === 'success' && importResult && (
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
            <CheckCircle2 size={32} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Import Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Successfully imported {importResult.importedCount} new contacts.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{importResult.totalRows}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Rows</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{importResult.importedCount}</p>
              <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Imported</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{importResult.duplicatesCount}</p>
              <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mt-1">Duplicates</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{importResult.invalidCount}</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">Invalid</p>
            </div>
          </div>

          {importResult.invalidRows.length > 0 && (
            <div className="text-left max-w-2xl mx-auto mb-8">
              <p className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">First few invalid rows:</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2 max-h-40 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {importResult.invalidRows.map((r, i) => (
                    <li key={i} className="text-red-600 dark:text-red-400 flex">
                      <span className="w-16 font-mono text-xs text-gray-500">Row {r.rowNumber}</span>
                      <span>{r.rawPhone || '(empty)'} - {r.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/contacts')} leftIcon={<Users size={18} />}>
              View Contacts
            </Button>
            <Button onClick={() => navigate('/campaigns/new')}>
              Create Campaign
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
