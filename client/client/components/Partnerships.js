import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Navbar from './Navbar';
import Footer from './Footer';
import withResponsive from './withResponsive';

class Partnerships extends Component {
    
    componentWillMount() {
        this.props.dispatch({ show_navigation: false });
    }
    
    componentWillUnmount() {
        this.props.dispatch({ show_navigation: true });
    }
    
    render() {
        const { dispatch, mobile_menu, isMobileScreen, isLargeScreen } = this.props;
        return (
            <React.Fragment>
                <Navbar key="navbar" dispatch={dispatch} mobile_menu={mobile_menu} />
                <section style={ isMobileScreen ? { padding: '50px 10px' } : isLargeScreen ? { maxWidth: '70%', padding: '50px 50px', margin: 'auto' } : { padding: '50px 200px' }}>
                    <h2 style={{ paddingLeft: '0px' }}>Partner with Changeroo</h2>
                    <p>
                        Do you represent an organisation that supports other organisations in management of societal value creation?
                        Then you may be interested in partnering up with us.
                    </p>
                    <h3>Example applications</h3>
                    <p>
                        Help your affiliated members and clients to do well by doing good.
                        Use Changeroo to enhance their strategic commitment to societal value creation,
                        and support progress within your network toward further societal significance.
                        Improve the quality of thinking, implementation and evaluation among your affiliated members/clients.
                    </p>
                    <div style={{ height: '180px', backgroundRepeat: 'no-repeat', maxWidth: '812px', backgroundSize: 'contain' , backgroundImage: 'url(/partnerships_wordle.png' }}>
                    
                    </div>
                    {/* <img src="/partnerships_wordle.png" alt="partnerships" /> */}
                         <p style={{ fontSize: '24px', fontWeight: 500 }}>>> Consulting and training agencies</p>
                         <p style={{  marginBottom: '10px' }}>
                            To help clients implement Theory of Change thinking in their organisations,
                            and to help clients continuously improve and implement the lessons taught.
                        </p>
                         <p style={{ fontSize: '24px', fontWeight: 500 }}>>> International development agencies</p>
                         <p style={{  marginBottom: '10px' }}>
                            As an instrument to facilitate and improve planning, monitoring,
                            evaluation and learning (PMEL) of projects undertaken and supported.
                        </p>
                         <p style={{ fontSize: '24px', fontWeight: 500 }}>>> Investors and grant makers</p>
                         <p style={{  marginBottom: '10px' }}>
                            To assess the quality of proposals of potential investees and grants recipients,
                            as well as to critically monitor progress being made.
                        </p>
                        <p style={{ fontSize: '24px', fontWeight: 500 }}>>> Network organisations</p>
                        <p style={{  marginBottom: '10px' }}>
                            To promote and professionalise the commitment to societal value creation among members,
                            as well as to stimulate collaboration between members.
                        </p>
                    <h3>Changeroo Partner Program</h3>
                    <p>Changeroo offers a special Partner Program that gives you privileged access to our tooling to use in your services. Help your members and clients to do well by doing good. Use Changeroo to enhance their strategic commitment to societal value creation, and support progress within your network toward further societal significance. Improve the quality of thinking, implementation and evaluation among your members/clients.</p>
                    <h3>Request for Information</h3>
                    <p style={{ display: 'inline-block', marginBottom: '50px' }}>
                        Do you want more information about Changeroo’s partner program?
                        Please <a href='/contact'>send a message</a> to Martin Klein and request our brochure.
                        We will gladly discuss the possibilities with you.

                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                        {
                            [0,1,2,3,4,5,6,7,8,9,10,11].map(index => {
                                return <Partner key={index} imageUrl={`partner-${index}${[7,8,9].includes(index) ? ".gif" : (index === 10) ? ".jpg" : ".png"}`} />
                            })
                        }
                    </div>

                </section>
                <Footer  key="footer" dispatch={dispatch} mobile_menu={mobile_menu} />
            </React.Fragment>
        );
    }
};

const Partner = ({ imageUrl }) => {
    return (
        <div style={{ width :'165px', backgroundPosition: '50%', backgroundRepeat: 'no-repeat', backgroundSize: 'contain', marginRight: '15px', marginBottom: '20px', height: '80px', backgroundImage: `url(/${imageUrl})` }} /> 
    )
};

export default withRouter(withResponsive(withStore(Partnerships)));