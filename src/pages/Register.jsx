import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Define validation schema for the registration form
const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    email: z.string().email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
    }),
});

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register: authRegister } = useAuth(); // Use register from AuthContext

    // Initialize react-hook-form
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values) => {
        const success = await authRegister(values.email, values.password, values.name);

        if (success) {
            // AuthContext's register function handles success toast.
            // Redirect to login page after a short delay to allow user to see the success message.
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        }
        // Error handling is managed within the authRegister function in the context.
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md rounded-2xl shadow-2xl border-t-4 border-teal-500">
                <CardHeader className="text-center p-8">
                    <CardTitle className="text-4xl font-extrabold text-gray-800 tracking-tight">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-md text-gray-500 mt-2">
                        Join the IIUC Bus System today.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your full name"
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
                                                placeholder="At least 8 characters"
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
                                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-75"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>
                    </Form>

                    <p className="mt-8 text-center text-gray-600 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:underline font-semibold transition-colors duration-200">
                            Login
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterPage;
