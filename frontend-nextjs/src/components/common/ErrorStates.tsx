import React from "react";
import { 
  ExclamationTriangleIcon, 
  WifiIcon, 
  ServerIcon, 
  ShieldExclamationIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  HomeIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import Button from "./Button";
import Link from "next/link";

interface ErrorStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline";
  };
  className?: string;
}

interface SpecificErrorProps {
  onRetry?: () => void;
  className?: string;
}

// Generic error state component
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      <div className="mx-auto h-12 w-12 text-error-400 mb-4">
        {icon || <ExclamationTriangleIcon className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "primary"}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant={secondaryAction.variant || "outline"}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

// Network error
export const NetworkError: React.FC<SpecificErrorProps> = ({ onRetry, className }) => {
  return (
    <ErrorState
      title="Connection Problem"
      description="Unable to connect to the server. Please check your internet connection and try again."
      icon={<WifiIcon className="h-12 w-12" />}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry,
        variant: "primary"
      } : undefined}
      className={className}
    />
  );
};

// Server error
export const ServerError: React.FC<SpecificErrorProps> = ({ onRetry, className }) => {
  return (
    <ErrorState
      title="Server Error"
      description="Something went wrong on our end. Our team has been notified and is working to fix the issue."
      icon={<ServerIcon className="h-12 w-12" />}
      action={onRetry ? {
        label: "Retry",
        onClick: onRetry,
        variant: "primary"
      } : undefined}
      secondaryAction={{
        label: "Go Home",
        onClick: () => window.location.href = "/dashboard",
        variant: "outline"
      }}
      className={className}
    />
  );
};

// Permission error
export const PermissionError: React.FC<SpecificErrorProps> = ({ className }) => {
  return (
    <ErrorState
      title="Access Denied"
      description="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
      icon={<ShieldExclamationIcon className="h-12 w-12" />}
      action={{
        label: "Go Back",
        onClick: () => window.history.back(),
        variant: "outline"
      }}
      secondaryAction={{
        label: "Go Home",
        onClick: () => window.location.href = "/dashboard",
        variant: "primary"
      }}
      className={className}
    />
  );
};

// Not found error
export const NotFoundError: React.FC<{ 
  resource?: string; 
  onRetry?: () => void;
  className?: string;
}> = ({ 
  resource = "page", 
  onRetry, 
  className 
}) => {
  return (
    <ErrorState
      title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found`}
      description={`The ${resource} you're looking for doesn't exist or may have been moved.`}
      icon={<DocumentMagnifyingGlassIcon className="h-12 w-12" />}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry,
        variant: "primary"
      } : {
        label: "Go Home",
        onClick: () => window.location.href = "/dashboard",
        variant: "primary"
      }}
      secondaryAction={onRetry ? {
        label: "Go Home",
        onClick: () => window.location.href = "/dashboard",
        variant: "outline"
      } : undefined}
      className={className}
    />
  );
};

// Empty state (not exactly an error, but similar pattern)
export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {icon || <DocumentMagnifyingGlassIcon className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button variant="primary">
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={action.onClick}
            variant="primary"
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
};

// Loading failed state
export const LoadingFailedError: React.FC<SpecificErrorProps> = ({ onRetry, className }) => {
  return (
    <ErrorState
      title="Failed to Load"
      description="We couldn't load the requested data. This might be a temporary issue."
      icon={<ArrowPathIcon className="h-12 w-12" />}
      action={onRetry ? {
        label: "Retry",
        onClick: onRetry,
        variant: "primary"
      } : undefined}
      className={className}
    />
  );
};

// Timeout error
export const TimeoutError: React.FC<SpecificErrorProps> = ({ onRetry, className }) => {
  return (
    <ErrorState
      title="Request Timeout"
      description="The request is taking longer than expected. Please try again."
      icon={<ExclamationTriangleIcon className="h-12 w-12" />}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry,
        variant: "primary"
      } : undefined}
      className={className}
    />
  );
};

// Generic API error handler
export const getErrorComponent = (
  error: any,
  onRetry?: () => void
): React.ReactElement => {
  const status = error?.response?.status || error?.status;
  
  switch (status) {
    case 401:
    case 403:
      return <PermissionError onRetry={onRetry} />;
    case 404:
      return <NotFoundError onRetry={onRetry} />;
    case 408:
      return <TimeoutError onRetry={onRetry} />;
    case 500:
    case 502:
    case 503:
    case 504:
      return <ServerError onRetry={onRetry} />;
    default:
      if (error?.code === "NETWORK_ERROR" || !navigator.onLine) {
        return <NetworkError onRetry={onRetry} />;
      }
      return <LoadingFailedError onRetry={onRetry} />;
  }
};
