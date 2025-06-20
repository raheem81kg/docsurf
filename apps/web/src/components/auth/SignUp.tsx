/** biome-ignore-all lint/nursery/useUniqueElementIds: <explanation> */
import { Button } from "@docsurf/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@docsurf/ui/components/card";
import { Input } from "@docsurf/ui/components/input";
import { Label } from "@docsurf/ui/components/label";
import { Link } from "@tanstack/react-router";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/Container";
import { authClient } from "@/lib/auth-client";

export default function SignUp() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSignUp = async () => {
		const { data, error } = await authClient.signUp.email(
			{
				email,
				password,
				name: `${firstName} ${lastName}`,
				image: image ? await convertImageToBase64(image) : "",
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onSuccess: () => {
					setLoading(false);
				},
				onError: async (ctx) => {
					setLoading(false);
					console.error(ctx.error);
					console.error("response", ctx.response);
					toast.error(ctx.error.message);
				},
			},
		);
		console.log({ data, error });
	};

	return (
		<Container>
			<Card className="max-w-md">
				<CardHeader>
					<CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
					<CardDescription className="text-xs md:text-sm">
						Enter your information to create an account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="first-name">First name</Label>
								<Input
									id="first-name"
									placeholder="Max"
									required
									onChange={(e) => {
										setFirstName(e.target.value);
									}}
									value={firstName}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="last-name">Last name</Label>
								<Input
									id="last-name"
									placeholder="Robinson"
									required
									onChange={(e) => {
										setLastName(e.target.value);
									}}
									value={lastName}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="m@example.com"
								required
								onChange={(e) => {
									setEmail(e.target.value);
								}}
								value={email}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="new-password"
								placeholder="Password"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Confirm Password</Label>
							<Input
								id="password_confirmation"
								type="password"
								value={passwordConfirmation}
								onChange={(e) => setPasswordConfirmation(e.target.value)}
								autoComplete="new-password"
								placeholder="Confirm Password"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="image">Profile Image (optional)</Label>
							<div className="flex items-end gap-4">
								{imagePreview && (
									<div className="relative h-16 w-16 overflow-hidden rounded-sm">
										<img
											src={imagePreview}
											alt="Profile preview"
											className="h-full w-full object-cover"
										/>
									</div>
								)}
								<div className="flex w-full items-center gap-2">
									<Input
										id="image"
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="w-full"
									/>
									{imagePreview && (
										<X
											className="cursor-pointer"
											onClick={() => {
												setImage(null);
												setImagePreview(null);
											}}
										/>
									)}
								</div>
							</div>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={loading}
							onClick={handleSignUp}
						>
							{loading ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								"Create an account"
							)}
						</Button>
					</div>
				</CardContent>
				<CardFooter>
					<div className="flex w-full justify-center border-t py-4">
						<p className="text-center text-neutral-500 text-xs">
							Secured by <span className="text-orange-400">better-auth.</span>
						</p>
					</div>
				</CardFooter>
			</Card>

			<p className="mt-4 text-center text-neutral-600 text-sm dark:text-neutral-400">
				Already have an account?{" "}
				<Link
					to="/sign-in"
					className="text-orange-400 underline hover:text-orange-500 dark:text-orange-300 dark:hover:text-orange-200"
				>
					Sign in
				</Link>
			</p>
		</Container>
	);
}

async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
