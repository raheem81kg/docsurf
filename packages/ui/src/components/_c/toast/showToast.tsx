import { cn } from "@docsurf/ui/lib/utils";
import { Check, Info, X } from "lucide-react";
import type { JSX } from "react";
import type { ExternalToast } from "sonner";
import { toast } from "sonner";

type IToast = {
   message: string;
   toastId: string | number;
   onClose: (toastId: string | number) => void;
};

type ToastAction = {
   label: string;
   onClick: () => void;
};

export const SuccessToast = ({ message, onClose, toastId, action }: IToast & { action?: ToastAction }) => (
   <div
      className={cn(
         "mb-2 flex h-auto items-center space-x-2 rounded-lg border border-border-subtle bg-background px-3 py-2.5 font-semibold text-sm text-text-default shadow-elevation-low md:max-w-sm rtl:space-x-reverse"
      )}
   >
      <span className="mt-0.5">
         <Check className="h-4 w-4" />
      </span>
      <p className="m-0 w-full flex-1 text-left">{message}</p>
      {action && (
         <button
            className="ml-2 rounded bg-muted px-2 py-1 font-medium text-primary text-xs hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => {
               action.onClick();
               onClose(toastId);
            }}
            type="button"
         >
            {action.label}
         </button>
      )}
      <span className="mt-0.5">
         <X className="h-4 w-4 hover:cursor-pointer" onClick={() => onClose(toastId)} />
      </span>
   </div>
);

export const ErrorToast = ({ message, onClose, toastId, action }: IToast & { action?: ToastAction }) => (
   <div
      className={cn(
         "mb-2 flex h-auto animate-[fade-in-up] items-center space-x-2 rounded-sm border border-border-semantic-error-subtle bg-bg-semantic-error-subtle px-3 py-2.5 font-semibold text-sm text-text-semantic-error shadow-elevation-low md:max-w-sm rtl:space-x-reverse"
      )}
   >
      <span className="mt-0.5">
         <Info className="h-4 w-4 text-semantic-error" />
      </span>
      <p className="m-0 w-full flex-1 text-left">{message}</p>
      {action && (
         <button
            className="ml-2 rounded bg-muted px-2 py-1 font-medium text-primary text-xs hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => {
               action.onClick();
               onClose(toastId);
            }}
            type="button"
         >
            {action.label}
         </button>
      )}
      <span className="mt-0.5">
         <X className="h-4 w-4 text-semantic-error hover:cursor-pointer" onClick={() => onClose(toastId)} />
      </span>
   </div>
);

export const WarningToast = ({ message, onClose, toastId, action }: IToast & { action?: ToastAction }) => (
   <div
      className={cn(
         "mb-2 flex h-auto animate-[fade-in-up] items-center space-x-2 rounded-sm border border-border-semantic-attention-subtle bg-bg-semantic-attention-subtle px-3 py-2.5 font-semibold text-sm text-text-semantic-attention shadow-elevation-low md:max-w-sm rtl:space-x-reverse"
      )}
   >
      <span className="mt-0.5">
         <Info className="h-4 w-4 text-semantic-attention" />
      </span>
      <p className="m-0 w-full flex-1 text-left">{message}</p>
      {action && (
         <button
            className="ml-2 rounded bg-muted px-2 py-1 font-medium text-primary text-xs hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => {
               action.onClick();
               onClose(toastId);
            }}
            type="button"
         >
            {action.label}
         </button>
      )}
      <span className="mt-0.5">
         <X className="h-4 w-4 text-semantic-attention hover:cursor-pointer" onClick={() => onClose(toastId)} />
      </span>
   </div>
);

const TOAST_VISIBLE_DURATION = 6000;

type ToastVariants = "success" | "warning" | "error";

export function showToast(
   message: string,
   variant: ToastVariants,
   options: number | (ExternalToast & { action?: ToastAction }) = TOAST_VISIBLE_DURATION
) {
   let _options: ExternalToast & { action?: ToastAction } = typeof options === "number" ? { duration: options } : { ...options };
   if (!_options.duration) _options.duration = TOAST_VISIBLE_DURATION;
   if (!_options.position) _options.position = "bottom-center";

   // Prevent user from passing 'description' or 'action' to Sonner
   if ("description" in _options) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description, ...rest } = _options;
      _options = rest;
   }
   if ("action" in _options) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { action: _action, ...rest } = _options;
      _options = rest;
   }

   const onClose = (toastId: string | number) => {
      toast.dismiss(toastId);
   };

   const action = typeof options === "object" && "action" in options ? options.action : undefined;

   const toastElements: {
      [x in ToastVariants]: (t: number | string) => JSX.Element;
   } = {
      success: (toastId) => <SuccessToast message={message} onClose={onClose} toastId={toastId} action={action} />,
      error: (toastId) => <ErrorToast message={message} onClose={onClose} toastId={toastId} action={action} />,
      warning: (toastId) => <WarningToast message={message} onClose={onClose} toastId={toastId} action={action} />,
   };

   return toast.custom(
      toastElements[variant] || ((toastId) => <SuccessToast message={message} onClose={onClose} toastId={toastId} action={action} />),
      _options
   );
}

/**
 * Sanitizes error messages to prevent exposing sensitive data
 * and makes them more user-friendly.
 */
function sanitizeErrorMessage(error: unknown): string {
   if (error instanceof Error) {
      // Don't expose internal error messages that might contain sensitive data
      if (
         error.message.includes("password") ||
         error.message.includes("token") ||
         error.message.includes("key") ||
         error.message.includes("secret") ||
         error.message.includes("auth") ||
         error.message.includes("credentials")
      ) {
         return "An error occurred. Please try again.";
      }

      // Make common error messages more user-friendly
      if (error.message.includes("network")) {
         return "Network error. Please check your connection.";
      }
      if (error.message.includes("timeout")) {
         return "Request timed out. Please try again.";
      }
      if (error.message.includes("permission")) {
         return "You don't have permission to perform this action.";
      }

      // For other errors, return a generic message
      return "Something went wrong. Please try again.";
   }

   // For non-Error objects, return a generic message
   return "An unexpected error occurred. Please try again.";
}

/**
 * Promise-based toast notifications.
 * @param promise The promise to track.
 * @param messages An object with loading, success, and error messages or functions.
 * @param options Additional toast options.
 */
showToast.promise = <T,>(
   promise: Promise<T>,
   messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
   },
   options?: Omit<ExternalToast, "action"> & { action?: ToastAction }
) => {
   const toastId = toast.custom(
      (id) => (
         <div
            className={cn(
               "mb-2 flex h-auto items-center space-x-2 rounded-lg border border-border-subtle bg-background px-3 py-2.5 font-semibold text-sm text-text-default shadow-elevation-low md:max-w-sm rtl:space-x-reverse"
            )}
         >
            <span className="mt-0.5">
               <Info className="h-4 w-4 animate-spin" />
            </span>
            <p className="m-0 w-full flex-1 text-left">{messages.loading}</p>
         </div>
      ),
      {
         ...options,
         duration: Number.POSITIVE_INFINITY,
         position: "bottom-center",
      }
   );

   return promise
      .then((data) => {
         const message = typeof messages.success === "function" ? messages.success(data) : messages.success;
         toast.custom(
            (id) => <SuccessToast message={message} onClose={(id) => toast.dismiss(id)} toastId={id} action={options?.action} />,
            {
               ...options,
               id: toastId,
               duration: TOAST_VISIBLE_DURATION,
               position: "bottom-center",
            }
         );
         return toastId;
      })
      .catch((error) => {
         // Use custom error message if provided, otherwise sanitize the error
         const message = typeof messages.error === "function" ? messages.error(error) : sanitizeErrorMessage(error);

         // Log the actual error for debugging
         console.error("Toast promise error:", error);

         toast.custom(
            (id) => <ErrorToast message={message} onClose={(id) => toast.dismiss(id)} toastId={id} action={options?.action} />,
            {
               ...options,
               id: toastId,
               duration: TOAST_VISIBLE_DURATION,
               position: "bottom-center",
            }
         );
         return toastId;
      });
};
