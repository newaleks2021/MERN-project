import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage/Social.css';

import withResponsive from './withResponsive';

const Footer = ({
    dispatch,
    mobile_menu,
    isLargeScreen,
    isMobileScreen
}) => (
    <React.Fragment>
        <section style={ isMobileScreen ? { padding: '67px 10px', backgroundColor: '#f5f7f8' } : { padding: '67px 200px', backgroundColor: '#f5f7f8' } }>
            <div style={ isLargeScreen ? { maxWidth: '70%', margin: 'auto' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', alignItems: 'center' }}>
                    <img src="logo.png" alt="logo" style={{ height: '45px', width: '200px' }} />
                    <div style={{  }}>
                        <Link style={{ textDecoration: 'none' }} to="/partnerships"><p style={{ color: '#36474f', marginBottom: '0px', fontSize: '18px', fontWeight: 300, lineHeight: '35px' }}>Partnership</p></Link>
                        <Link style={{ textDecoration: 'none' }} to="/contact"><p style={{ color: '#36474f', marginBottom: '0px', fontSize: '18px', fontWeight: 300, lineHeight: '35px' }}>Contact</p></Link>
                        <Link style={{ textDecoration: 'none' }} to="/pricing"><p style={{ color: '#36474f', marginBottom: '0px' ,fontSize: '18px', fontWeight: 300, lineHeight: '35px' }}>Pricing</p></Link>
                    </div>
                    <div >
                        <Link style={{ textDecoration: 'none' }} to="/support"><p style={{ color: '#36474f', marginBottom: '0px', fontSize: '18px', fontWeight: 300, lineHeight: '35px' }}>Support</p></Link>
                        <Link style={{ textDecoration: 'none' }} to="/privacy"><p style={{ color: '#36474f', marginBottom: '0px', fontSize: '18px', fontWeight: 300, lineHeight: '35px' }}>Privacy</p></Link>
                        <Link style={{ textDecoration: 'none' }} to="/terms"><p style={{ color: '#36474f', marginBottom: '0px', fontSize: '18px', fontWeight: 300, lineHeight: '35px' }}>Terms</p></Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ marginBottom: '0px',fontWeight: 500, fontSize: '18px', lineHeight: '26px', color: '#36474f' }}>
                                Say Hello!
                            </p>
                            <p style={{ marginBottom: '0px', fontSize: '18px', lineHeight: '26px', color: '#36474f' }}>
                                info@changeroo.com
                            </p>
                        </div>
                        <Link page="sign-up" to="/sign-up" onClick={() => dispatch({ mobile_menu: false })}>
                            <button className="small sky round" style={{ width: '100px', height: '30px', marginTop: '15px'}} >Sign up</button>
                        </Link>
                    </div>
                    <div style={{ display: 'flex', alignItems:'flex-end', height: '100px' }}>
                        <div className="fb" />
                        <div className="linkedin" />
                        <div className="twitter" />
                    </div>
                </div>
            </div>
        </section>
        <div style={{ padding: '0px 16px', backgroundColor: '#e24a00', height: '56px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <p style={{ display: 'inline-block', margin: '0px', fontWeight: 300, fontSize: '14px', color: 'white', textAlign: 'end' }}>
                Copyright © 2018 Changeroo, Business for Development BV.
            </p>
        </div>
    </React.Fragment>
);

export default withResponsive(Footer);