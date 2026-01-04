import { Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { setUser } from "./hooks/localStorage";

const LoginPage = () => {
    const { user, isAuthenticated, loginWithRedirect } = useAuth0();


    if (isAuthenticated) {
        setUser(JSON.stringify(user));
        return <Navigate to="/" />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h2>Login</h2>
            <button onClick={() => {
                loginWithRedirect();
            }} style={{ padding: '8px 16px', marginTop: '10px' }}>Login with GitHub</button>
        </div>
    );
};

export default LoginPage;
