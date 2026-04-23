import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";

import { api } from "@/lib/api";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await api.login(email, password);
            console.log("Login response:", response);

            // Check if response has data and token
            const data = response.data;
            // Support both data.jwToken (current) and data.token or root token/jwToken
            const token = data?.jwToken || data?.token || response.token || response.jwToken;

            if (token) {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(data || response));
                navigate("/");
            } else {
                console.error("No token found in response", response);
                setError("Login failed: Authentication token missing");
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            setError("Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/20 before:via-gray-50/0 before:to-gray-50/0 dark:before:from-primary/10 dark:before:via-gray-900/0 dark:before:to-gray-900/0">
            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-primary">TekConsult</h1>
                        <p className="text-sm font-medium text-muted-foreground">Admin Panel</p>
                    </div>
                </div>

                <Card className="border-t-4 border-t-primary shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-xl font-semibold">Sign in to your account</CardTitle>
                        <CardDescription>
                            Enter your credentials to access the dashboard
                        </CardDescription>
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-xs font-medium p-2.5 rounded-md border border-destructive/20 mt-2">
                                {error}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-10 transition-all focus-visible:ring-primary"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <a href="#" className="text-xs font-medium text-primary hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 transition-all focus-visible:ring-primary"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all hover:shadow-lg" disabled={isLoading}>
                                {isLoading ? "Authenticating..." : "Sign In"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t bg-muted/30 py-4">
                        <div className="text-sm text-muted-foreground">
                            <span className="mr-1">Having trouble?</span>
                            <a href="#" className="font-medium text-primary hover:underline">
                                Contact Support
                            </a>
                        </div>
                    </CardFooter>
                </Card>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} TekConsult. All rights reserved.
                </div>
            </div>
        </div>
    );
}
