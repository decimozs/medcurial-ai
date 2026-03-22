import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { DocumentEnrollmentForm } from '@/components/document-enrollment-form';

export const Route = createFileRoute('/enroll-documents')({
  component: DocumentEnrollmentPage,
});

function DocumentEnrollmentPage() {
  return (
    <div className="container relative mx-auto py-10 px-4 min-h-screen flex flex-col items-center justify-center">
      <div className="fixed top-8 left-8 sm:top-12 sm:left-12 z-50">
        <Link to="/documents" className="inline-flex items-center text-[13px] font-semibold text-muted-foreground/60 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registry
        </Link>
      </div>

      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <DocumentEnrollmentForm />
      </div>
    </div>
  );
}
