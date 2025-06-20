import { Progress } from "@workspace/ui/components/progress";

import { FileDown, X } from "lucide-react";
import { toast } from "sonner";

type ProgressToastProps = {
	message?: string;
	progress: number;
	toastId: string | number;
	onClose: (toastId: string | number) => void;
};

export const ProgressToast = ({
	message,
	progress,
	onClose,
	toastId,
}: ProgressToastProps) => {
	const defaultMessage = "Downloading";

	return (
		<div className="mb-2 flex h-auto animate-[fade-in-up] flex-col space-y-2 rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2.5 font-semibold text-sm shadow-elevation-low md:max-w-sm">
			<div className="flex items-center gap-2">
				<span className="mt-0.5">
					<FileDown className="h-4 w-4" />
				</span>
				<p className="m-0 w-full text-left">{message || defaultMessage}</p>
				<button onClick={() => onClose(toastId)}>
					<X className="h-4 w-4 hover:cursor-pointer" />
				</button>
			</div>
			<Progress value={progress} className="h-2" />
			<div className="text-right font-normal text-xs">
				{Math.floor(progress)}%
			</div>
		</div>
	);
};

export function showProgressToast(
	progress: number,
	message?: string,
	toastId = "download-progress",
) {
	const onClose = (id: string | number) => {
		toast.dismiss(id);
	};

	return toast.custom(
		(id) => (
			<ProgressToast
				message={message}
				progress={progress}
				onClose={onClose}
				toastId={id}
			/>
		),
		{
			id: toastId,
			duration: Number.POSITIVE_INFINITY, // Keep the toast visible until dismissed
			position: "bottom-center",
		},
	);
}

export function hideProgressToast(toastId = "download-progress") {
	toast.dismiss(toastId);
}
