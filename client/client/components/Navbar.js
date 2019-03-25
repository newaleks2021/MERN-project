import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({
    dispatch,
    mobile_menu,
}) => (
    <div key="top" className="top-container" style={{ position: 'relative' }}>
        <header className="top">
        <div className="container">
        <div className="Navbar_Wrapper">
            <div style={{ flex: 1 }}>
                <Link className="logo" to="/"></Link>
            </div>
            <div style={{ width: '85%', paddingLeft: '30px' }}>
                <div className="mobile-menu" onClick={() => dispatch({ mobile_menu: !mobile_menu })}></div>
                <nav className={ mobile_menu ? 'toggled' : '' }>
                    <Link style={{ textDecoration: 'none' }} page="sign-in" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>Log in</Link>
                    <Link style={{ textDecoration: 'none' }} page="sign-up" to="/sign-up" onClick={() => dispatch({ mobile_menu: false })}><button className="small sky round" >Sign up</button></Link>
                    <Link style={{ textDecoration: 'none' }} page="academy" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>ToC Academy</Link>
                    <Link style={{ textDecoration: 'none' }} page="pricing" to="/pricing" onClick={() => dispatch({ mobile_menu: false })}>Pricing</Link>
                </nav>
                </div>
            </div>
        </div>
        </header>
    </div>
);

export default Navbar;
