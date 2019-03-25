import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import { withStore } from '../store';
import Carousel from './Carousel';
import Navbar from './Navbar';
import Footer from './Footer';
import Benefit from './HomePage/Benefit';
import BenefitHeader from './HomePage/BenefitHeader';
import Feature from './HomePage/Feature';
import withResponsive from './withResponsive';
import { isSameMinute } from 'date-fns';

const benefitsStyle = { 
    marginRight: '5px', 
    padding: '15px 0px', 
    display: 'flex', 
    flexDirection: 'column', 
    flex: 0.5,
    minWidth: '300px' 
};

const btnTryForFree = {
    marginRight: '20px', 
    width: '195px', 
    height: '60px', 
    borderRadius: '5px', 
    border: '1px solid #e04b1a' 
};

const btnSubscription = { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#e04b1a', 
    width: '195px', height: '60px', 
    borderRadius: '5px', 
    border: '1px solid #e04b1a' 
};

class Welcome extends Component {

    componentWillMount() {
        this.props.dispatch({ show_navigation: false });
    }
    componentWillUnmount() {
        this.props.dispatch({ show_navigation: true });
    }
    render() {

        const { dispatch, mobile_menu, isMobileScreen, isLargeScreen } = this.props;

        console.log("isMobileScreen: ", isMobileScreen);
        console.log("isLargeScreen: ", isLargeScreen);

        return (
            <React.Fragment>
        
            <Navbar key="navbar" dispatch={dispatch} mobile_menu={mobile_menu} />,

            <section style={ isMobileScreen ? { display: 'none' } : { marginBottom: '25px', display: 'flex', alignItems: 'center' , backgroundSize: 'cover', height: '828px', backgroundBlendMode: 'multiply', backgroundImage: 'url(/photo-0.png), linear-gradient(to bottom, rgba(74, 74, 74, 0.8), rgba(74, 74, 74, 0.8))' }}>
                <div style={{ marginTop: '-150px',marginLeft: '130px' ,display: 'flex', flexDirection :'column' , width: '780px' }}>
                    <p style={{ display: 'inline-block' , marginBottom: '10px', fontWeight: 500, fontSize: '60px', color: 'white' }}>
                        A strategic approach to a
                        better world with <span style={{  margin: '0px 5px', color: '#e24a00' }}> Changeroo</span>
                    </p>
                    <p style={{ marginBottom: '20px', color: 'white', fontWeight: 300, fontSize: '24px', lineHeight: '36px' }}>
                        Communicate from the perspective of societal value creation
                    </p>
                    <div style={{ display: 'flex' }}>
                    <button style={{  marginRight: '20px', width: '195px', height: '60px', borderRadius: '5px' }} > 
                        <p style={{ margin: 0, display: 'inline-block', textAlign: 'center', fontWeight: 500, fontSize: '18px', color: '#e04b1a' }}>Try for free</p>
                    </button>
                    <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e04b1a', width: '195px', height: '60px', borderRadius: '5px', border: '1px solid #e04b1a' }}>
                        <p style={{ margin: 0, display: 'inline-block', textAlign: 'center', fontWeight: 500, fontSize: '18px', color: 'white' }}>Get a Subscription</p>
                    </button>
                    </div>
                </div>
            </section>

            <section key="about" className="about">
                <Container>
                    <Row style={ isLargeScreen ? { maxWidth: '70%', margin: 'auto' } : {} }>
                        <Col md="6" style={{}}>
                            <iframe title="video" src="https://player.vimeo.com/video/229111344" frameBorder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowFullScreen style={{height: '314px', width: '100%'}}></iframe>
                        </Col>
                        <Col md="6" >
                            <h3 style={{ paddingTop: '0px', paddingLeft: '0px' }}>A strategic management approach to societal value creation</h3>
                            <p className="no-flex" style={{ paddingLeft: '0px', fontSize: '24px', fontWeight: 300 }}>Changeroo is a web-based tool and platform for organizations, programs and projects with a social mission. It makes a Theory of Change a living, breathing document for (adaptive) learning.</p>
                        </Col>
                    </Row>
                    <Row style={ isLargeScreen ? { maxWidth: '70%', margin: 'auto' } : {} }>
                        <Col md="4">
                            <p style={{ paddingLeft: '0', fontSize: '24px', fontWeight: 300}}>It provides a way of communicating about research evidence for intervention to societal challenges, identifing evidence gaps and collaboratively working on testing not-yet-validated assumptions, while giving stakeholders a voice.</p>
                        </Col>
                        <Col md="8">
                            <video autoPlay={true} style={{height: '400px', width: '100%'}}>
                                <source type="video/mp4" data-reactid=".0.1.0.0.0" src="screencast.mp4" />
                            </video>
                        </Col>
                    </Row>
                </Container>
            </section>,

            <section style={{ backgroundColor: '#f5f7f8', padding: '50px 0px', lineHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '32px', lineHeight: '38px'}}> With awesome features to help you </h2>
                    <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '32px', lineHeight: '38px'}}> Improve your work </h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Feature color = "orange" index = "1" text = "Visualize your Theory of Change" />
                    <Feature color = "blue" index = "2" text = "Zoom in on details and show insight into practise" />
                    <Feature color = "orange" index = "3" text = "Innovative stakeholder engagement" />
                    <Feature color = "blue" index = "4" text = "Integration with other applications" />
                    <Feature color = "orange" index = "5" text = "Logic, visual mapping, communication and engagement" />             
                </div>
            </section>,

            <section key="sliders" className="sliders" style={{ backgroundColor: '#36474f', lineHeight: 0 }}>
                <div style={{ width: '100%' }}>
                    <div className="container" style={{ padding: '50px 0px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h3  style={{ color: 'white', padding: 0, margin: 0, marginBottom: '5px' }}>Changeroo empowers some of</h3>
                            <h3  style={{ color: 'white', padding: 0, margin: 0, marginBottom: '50px' }}> the industry leaders</h3>
                        </div>
                        <Carousel collection="partners" />
                        <Carousel collection="quotes" />
                    </div>
                </div>
            </section>,

            <div style={ isLargeScreen ? { maxWidth: '70%', margin: 'auto' } : {}}>
                <section style={ isMobileScreen ? { padding: '50px 10px' }: { padding: '50px 140px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '32px', fontWeight: 300, display :'inline' }}>Learn about the benefits of Changeroo</p>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <p style={{ fontSize: '32px', fontWeight: 300,   display: 'inline' }}>for both <span style={{ fontWeight: 500 }}>Organization</span> and <span style={{ fontWeight: 500 }}>Stakeholder</span></p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-10px' }}>
                            <div style={{ height: '36px', borderLeft: '1px solid #36474f' }}></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ height: '19px', width: '19px', borderRadius: '50%', border: '1px solid #36474f' }}></div>
                            <div style={{ flexGrow: 1, border: "0.5px solid #36474f" }}></div>
                            <div style={{ height: '19px', width: '19px', borderRadius: '50%', border: '1px solid #36474f' }}></div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '0px 10px' }}>
                            <div style={isMobileScreen ? {...benefitsStyle, flexGrow: 1} : {...benefitsStyle}}>
                                <BenefitHeader header="Organizations" subHeader= "Organizations, programs and projects develop and manage their Theories of Change"  />

                                <Benefit text = "Foster a culture of strategic learning, critical thinking and results" />
                                <Benefit text = "To guide you there are turorials, illustrations, thought tools,
                                templates and questions to ask" />
                                <Benefit text = "Communicate from the prespective of societal value creation" />
                                <Benefit text = "Build buy-in from funders, civil society, employees, and 
                                    all stakeholders alike" />
                                <Benefit text =  "Build your framework for impact measurement, learning, 
                                    monitoring and evaluation" />
                                <Benefit text = "Have an evlolving shared understanding and compass towards 
                                    the desired impact" />
                            </div>
                            <div style={isMobileScreen ? {...benefitsStyle, flexGrow: 1} : {...benefitsStyle}}>
                                <BenefitHeader header="Stakeholders" subHeader="Civil society, researchers, funders, and others 
                                who engage with the Theories of Changes of orgnizations" />

                                <Benefit text = "Learn about social organizations, their impact rationales and progress achieved" />
                                <Benefit text = "Employ your expertise to be of help and influence" />
                                <Benefit text = "Present yourself through your contributions" />
                                <Benefit text = "Utilize expertise and resources of stakeholders" />
                                <Benefit text =  "Basis for decision making" />
                                <Benefit text = "Learn from other stakeholders" />
                                <Benefit text = "Indentify organizations to work with" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section style={ isMobileScreen ? { padding: '64px 15px', backgroundColor: '#f5f7f8' } : { padding: '64px 137px', backgroundColor: '#f5f7f8' }}>
                <div style={ isLargeScreen ? { maxWidth: '70%', margin: 'auto' } : {} }>
                    <p style={{ fontSize: '32px', lineHeight: '38px', fontWeight: 700, color: '#36474f', paddingLeft: '0px' }}>Partner with us!</p>
                    <p style={{ fontWeight: 300, fontSize: '24px', lineHeight: '35px', color: '#36474f', marginBottom: '15px' }}>
                        We partner with monitoring and evalutation consultants and trainers, international
                        development organizations, networks organizing around social entrepreneurship or
                        sustainability, and others. Join us helping move societal value creation to the 
                        next level. Foster a culture of strategic learning among your intiatives and members
                        as well as improve planning, monitoring and evalutation.
                    </p>
                    <Link style={{ textDecoration: 'none' }} to="/partnerships">
                        <p style={{ fontWeight: 500, fontSize: '24px', color: '#01bcd6' }}>
                            More information >
                        </p>
                    </Link>
                </div>
            </section>
            
            <div style={ isLargeScreen ? { maxWidth: '70%', margin: 'auto' } : {} }>
                <section style={isLargeScreen ? { padding: '69px 90px' } : isMobileScreen ? { padding: '69px 10px' } : { padding: '69px 140px' }}>
                    <div style={ isMobileScreen ? { display :'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' } : { display :'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <div style={{ flexGrow: 1, marginRight: '15px' }}>
                            <h3 style={{ paddingBottom: '20px', textAlign: 'left' }}>Boost your impact journey today with Changeroo</h3>
                            <p style={{ fontWeight: 300, fontSize: '24px', lineHeight: '35px' }}>
                                Try Changeroo for free or purchase a license for just €195 and set 
                                your first step to societal value creation
                            </p>
                        </div>
                        <div style={ isMobileScreen ? { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', flexGrow: 1 }: { display: 'flex' }}>
                            <button style={isMobileScreen ? { ...btnTryForFree, width: '100%', marginRight:'0px' ,marginBottom: '15px' } : { ...btnTryForFree }} > 
                                <Link to='/sign-up'><p style={{ margin: 0, display: 'inline-block', textAlign: 'center', fontWeight: 500, fontSize: '18px', color: '#e04b1a' }}>Try for free</p></Link>
                            </button>
                            <button style={ isMobileScreen ? { ...btnSubscription, width: '100%' } : { ...btnSubscription } }>
                                <p style={{ margin: 0, display: 'inline-block', textAlign: 'center', fontWeight: 500, fontSize: '18px', color: 'white' }}>Get a Subscription</p>
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <Footer  key="footer" dispatch={dispatch} mobile_menu={mobile_menu} />
        </React.Fragment>
        );
    }
}

export default withRouter(withResponsive(withStore(Welcome)));