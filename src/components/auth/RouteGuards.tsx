import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Robust authentication check
 */
const isAuthenticated = () => {
    try {
        const token = localStorage.getItem("token");
        // A basic token should be a non-empty string and not be the string literal "null" or "undefined"
        // Also a JWT token is typically quite long, so a length check helps
        return !!token && token !== "undefined" && token !== "null" && token.trim().length > 10;
    } catch (e) {
        return false;
    }
};

/**
 * ProtectedRoute component - Redirects to /login if the user is not authenticated
 * Used for pages that require authentication
 */
export const ProtectedRoute = () => {
    const location = useLocation();

    if (!isAuthenticated()) {
        // Redirect to the login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // back to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

/**
 * PublicRoute component - Redirects to / if the user is already authenticated
 * Used for the login page to prevent logged-in users from going back to it
 */
export const PublicRoute = () => {
    if (isAuthenticated()) {
        // If logged in, redirect to the dashboard
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
