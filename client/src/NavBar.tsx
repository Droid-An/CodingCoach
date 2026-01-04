
import { NavLink } from 'react-router-dom';

function NavBar() {
    return (
        <nav className="navbar bg-primary navbar-expand-lg" data-bs-theme="dark" style={{ margin: '24px', padding: '12px', borderRadius: '8px' }}>
            <div className="container-fluid">
                <span className="navbar-brand mb-0 h1">
                    Code Review
                </span>
                <div className="collapse navbar-collapse">
                    <nav>
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/" end>
                                    Home
                                </NavLink>
                            </li>
                            {/* <li className="nav-item">
                                <NavLink className="nav-link" to="/import" end>
                                    Import from Github
                                </NavLink>
                            </li> */}
                        </ul>
                    </nav>
                </div>
            </div>
        </nav>
    );
}

export default NavBar;