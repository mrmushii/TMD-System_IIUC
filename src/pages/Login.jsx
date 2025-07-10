import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

// Auth Context
import { useAuth } from '../App'; // Assuming useAuth is exported from App.js

// Icons
import { Loader2 } from 'lucide-react';

// Define validation schema for the login form
const formSchema = z.object({
    email: z.string().email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
});

const LoginPage = () => {
    const { login } = useAuth(); // Use the login function from AuthContext

    // Initialize react-hook-form
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values) => {
        const success = await login(values.email, values.password);

        if (!success) {
            // The AuthContext's login function already displays an error toast.
            // Set a form error for specific UI feedback on the input field.
            form.setError('password', { type: 'manual', message: 'Invalid email or password.' });
        }
        // No need to navigate here; the AuthProvider's state change handles it.
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md rounded-2xl shadow-2xl border-t-4 border-indigo-500">
                <CardHeader className="text-center p-8">
                    <CardTitle className="text-4xl font-extrabold text-gray-800 tracking-tight">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-md text-gray-500 mt-2">
                        Access your IIUC Bus System account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="your.email@example.com"
                                                {...field}
                                                className="h-12 text-base rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                                className="h-12 text-base rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-75"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </Button>
                        </form>
                    </Form>

                    <p className="mt-8 text-center text-gray-600 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-600 hover:underline font-semibold transition-colors duration-200">
                            Register
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
