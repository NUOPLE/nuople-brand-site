import type { ReactNode } from 'react';

interface ErrorRenderProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  children?: ReactNode;
}

export function ErrorRender({ error }: ErrorRenderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col justify-center items-center text-center">
        <p className="text-base text-red-600 font-medium mb-2">页面出错了</p>
        {error && (
          <p className="text-sm text-gray-500 max-w-md break-all">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ErrorRender;
