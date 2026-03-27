'use client';

import {
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
} from 'firebase/auth';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { auth } from './firebase';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [setResetEmailSent] = useState(false);
	const router = useRouter();

	const Login = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			console.log('User logged in:', userCredential.user);
			router.push('../dashboard');
		} catch (err) {
			console.error(err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const SignUp = () => {
		router.push('./signUp');
	};

	const ForgotPassword = async () => {
		if (!email) {
			alert('Please enter your email address below.');
			return;
		}
		setLoading(true);
		try {
			await sendPasswordResetEmail(auth, email);
			setResetEmailSent(true);
			alert('Password reset email sent.');
		} catch (error) {
			console.error('Error sending password reset email:', error);
			// alert('Error sending password reset email. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-grey-900">
			<div className="w-full max-w-md p-8 space-y-6 bg-grey-800 rounded shadow-md">
				<h2 className="text-center text-3xl font-bold text-white">Login</h2>

				{error && <p className="text-red-500 text-center">{error}</p>}

				<form onSubmit={Login} className="mt-8 space-y-6">
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Email address"
							/>
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Password"
							/>
						</div>
					</div>
					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							{loading ? 'Logging in...' : 'Sign in'}
						</button>
					</div>
				</form>

				<div className="text-center">
					<a
						href="#"
						onClick={ForgotPassword}
						className="text-sm text-indigo-500 hover:text-indigo-400"
					>
						Forgot your password?
					</a>
				</div>

				<div className="text-center">
					<button
						onClick={SignUp}
						className="text-sm text-indigo-500 hover:text-indigo-400 ml-2"
					>
						Create Account
					</button>
				</div>
			</div>
		</div>
	);
}
