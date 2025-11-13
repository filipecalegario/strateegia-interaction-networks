import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeLogin } from '../legacy/core/auth.js';

function LoginPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Login';
        const cleanup = initializeLogin((selectedMode) => {
            const search = selectedMode ? `?mode=${selectedMode}` : '';
            navigate(`/main${search}`);
        });

        return () => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [navigate]);

    return (
        <div className="container p-5 d-flex justify-content-center">
            <form className="form-group center-block" onSubmit={(event) => event.preventDefault()}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        seu login em strateegia
                    </label>
                    <input type="email" className="form-control" id="username" aria-describedby="emailHelp" />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        sua senha em strateegia
                    </label>
                    <input type="password" className="form-control" id="password" />
                </div>
                <div className="d-flex justify-content-center">
                    <button type="button" className="btn btn-primary btn-md" id="btnLogin">
                        entrar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default LoginPage;
