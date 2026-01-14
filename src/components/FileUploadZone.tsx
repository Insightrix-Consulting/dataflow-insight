import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUploadDocument } from '@/hooks/useDocuments';
import { DocumentType } from '@/types/database';

interface FileUploadZoneProps {
  documentType: DocumentType;
  onUploadComplete?: () => void;
}

export function FileUploadZone({ documentType, onUploadComplete }: FileUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const uploadDocument = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    for (const file of files) {
      await uploadDocument.mutateAsync({ file, documentType });
    }
    setFiles([]);
    onUploadComplete?.();
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'upload-zone cursor-pointer',
          isDragActive && 'dragging'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? (
            'Drop the files here...'
          ) : (
            <>
              <span className="font-medium text-foreground">Click to upload</span> or drag and drop
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF files only (max 10MB each)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            onClick={handleUpload}
            disabled={uploadDocument.isPending}
            className="w-full"
          >
            {uploadDocument.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} file{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
