import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Navbar from './Navbar';
import Footer from './Footer';
import withResponsive from './withResponsive';

class Privacy extends Component {
    
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
        
                <Navbar key="navbar" dispatch={dispatch} mobile_menu={mobile_menu} />,
                <section style={ isMobileScreen ? { padding: '50px 10px' } : isLargeScreen ? { maxWidth: '70%', padding: '50px 50px', margin: 'auto' } : { padding: '50px 200px' }}>
                    <h2 style={{ paddingLeft: '0px' }}>Privacy Policy </h2>
                    <p style={{ display: 'inline-block' }}>
                        We hate legalese, so we've tried to make ours readable.
                        If you've got any questions, feel free to 
                        <a href='/contact/' style={{ margin: '0px 5px' }}>ask us</a>, 
                        and we'll do our best to answer.
                    </p>
                    <p>This privacy statement ("Privacy Policy") covers the website www.changeroo.com ("Changeroo") owned and operated by Business for 
                        Development BV ("we", "us", "our") and all associated services.</p>
                    <p>We use information you share with us for our internal business purposes. We do not sell your information. This notice tells you what information we collect,
                         how we use it, and steps we take to protect and secure it.</p>
                    <p>Your privacy is critically important to us. We have a few fundamental principles:</p>
                    <ul>
                        <LI>We don't ask you for personal information unless we truly need it.</LI>
                        <LI>
                            We don't share your personal information with anyone except to comply with the law, develop our products, or protect our rights.
                            Registered users do have a publicly visible profile which contains information provided by you.
                        </LI>
                        <LI>We don't store personal information on our servers unless required for the on-going operation of one of our services.                            
                        </LI>
                        <LI>We aim to make it as simple as possible for you to control what's visible to the public, kept private, and permanently deleted.
                        </LI>
                    </ul>
                    <p>If you have questions about deleting or correcting your personal data please contact us.</p>
                    <h3>Information we automatically collect</h3>
                    <p style={{ fontWeight: 'bold' }}>Non-personally-identifying</p>
                    <p>Like most website operators, we collect non-personally-identifying information such as browser type, language preference, referring site, account statistics, 
                        and the date and time of each visitor request.</p>
                    <p>We collect this to understand how our visitors use our service, and use it to make decisions about how to change and adapt the service.</p>
                    <p>From time to time, we may release non-personally-identifying information in aggregate form (for instance, by publishing trends in site usage) to explain our 
                        reasoning in making decisions. We will not 
                        release individual information, only aggregate information.</p>
                        <p style={{ fontWeight: 'bold' }}>Personally-identifying</p>
                    <p>We automatically collect personally-identifying information, such as IP address, provided by your browser and your computer.</p>
                    <p>We collect this information for several purposes:</p>
                    <ul>
                        <LI>To diagnose and repair network issues with your use of the site;</LI>
                        <LI>To estimate the number of users accessing the service from specific geographic regions;</LI>
                        <LI>To help prevent fraud and abuse.</LI>
                    </ul>
                    <H3>Information you are required to provide to us on registration</H3>
                    <p>We ask visitors who sign up for an account to provide a username, 
                        personal name and email address. Those who also sign up for an 
                        organization account will in addition be asked to provide us with 
                        the organization's name and VAT number, if applicable. </p>
                    <p>We will use your email address to send confirmation of certain actions,
                         such as when you change your password. We will contact you when 
                         it's necessary to complete a transaction that you've initiated, 
                         or if there's a critical or administrative issue affecting 
                         your use of the service. </p>
                    <p>We may occasionally send you an email to tell you about new 
                        features, solicit your feedback, or just keep you up to date 
                        with what's going on with us and our products. We primarily 
                        use our website to communicate this type of information, so 
                        we expect to keep this type of email to a minimum.</p>
                    <p>Your name and username are used to build your public profile 
                        as to show the origin of your contributions to organizations'
                         Changeroo accounts. They are also used to identify users for
                          moderator purposes.
                    </p>
                    <p>We will never sell or provide your email address or any other personal
                         information to any third party, with exceptions as set forth below.
                    </p>
                    <h3>Optional information you provide to us</h3>
                    <p>As you use our service, you have the option to provide more personal information, 
                        through your profile (user profile, organization profile and/or Theory of Change profile), your entries, or comments you make. Providing 
                        this information is strictly optional.</p>
                    <p>We will show this information to others viewing the site, as part of your user profile. We may also use this information, in aggregate, to make decisions about 
                        how to change and adapt the service.</p>
                    <p>From time to time, we may release information in aggregate form (for instance, by publishing trends in site usage) to explain our reasoning in making decisions. 
                        We will not release individual information,
                         only aggregate information.</p>
                    <p>We will not sell or provide this information to any third party, with exceptions as set forth below.</p>
                    <p>By choosing to make any personally-identifying information public, you recognize and accept that other people, not affiliated with us, may use this data to contact you. 
                        We can't be responsible for the use of any information you post publicly.</p>
                    <p>Additional information about your account, not included in your public profile, includes the status of your account (when and if account was activated) 
                        and user rights such as whether someone has administrator rights.</p>
                    <h3>Financial information and transactions</h3>
                    <p>Transaction data, including personal data, can be transferred to PayLane Sp. z o.o. located in Gdańsk at Arkońska 6/A3, zip code: 80-387, 
                        company number: 0000227278, in order to process payments. </p>
                    <p style={{ display: 'inline-block' }}>You can engage in financial transactions with us to subscribe to an organization account. These transactions are optional. 
                        If you choose to subscribe to an organization account, you will be referred to <a href='http://paylane.com'>PayLane</a>, an online payments provider. 
                    PayLane will ask you to provide financial information to complete the transaction. There are several payment methods available – including credit cards,
                     debit cards and for various countries local payment methods – each of which requires disclosure 
                    of certain personal and 
                    financial information. PayLane will only use this information to process your payment. After processing your payment you will be redirected back to our site.
                     We do not store any of your financial information.</p>
                    <H3>Disclosure of personally-identifying information</H3>

                    <p>We disclose potentially personally-identifying and personally-identifying information only to those of our employees, contractors and affiliated organizations that (i) need to
                         know that information in order to process it on 
                        our behalf or to provide services available at our website, and (ii) that have agreed not to disclose it to others. Some of those employees, contractors and affiliated 
                        organizations may be located outside of your home country.
                        By using this website, you consent to the transfer of your information to them.</p>
                    <p>If all of our assets were transferred or acquired, your information would be one of the assets that is transferred or acquired by a third party.</p>
                    <p>We will not rent or sell potentially personally-identifying and personally-identifying information to anyone. Other than to our employees, contractors and affiliated organizations, 
                        as described above, we disclose potentially personally-identifying and personally-identifying information only when that release is required 
                        by law or by court order, or when we believe
                         in good faith that disclosure is reasonably
                         necessary to protect the safety or rights of us, third parties, or the public at large.</p>
                    <h3>Cookies</h3>
                    <p>A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's browser provides to the website each time the 
                        visitor returns. We use cookies to help us 
                        identify and track visitors, their usage of the website, and their website 
                        access preferences. We also use cookies to govern logging into your account.</p>
                    <p>Visitors who do not wish to have cookies placed on their computers should set their browsers to refuse cookies before using the site, 
                        with the drawback that certain features of the site may not 
                        function properly without the aid of cookies.</p>
                    <h3>Confidentiality and security</h3>
                    <p>No data transmission over the Internet can ever be guaranteed to be 100% secure. You use this service at your own risk. However, we do take steps to ensure security on our systems.</p>
                    <p>Your account information is password-protected. We recommend that you choose a strong and secure password. We use industry-standard encryption to safeguard
                         any transmission between your computer and ours.</p>
                    <p>If we learn of a system security breach, we will notify you electronically so you can take appropriate steps to protect yourself.</p>
                    <h3>Deleting your information</h3>
                    <p>You can change or delete any optional information that you've provided us at any time. If you change or delete any optional information you've provided, the change
                         will take place immediately. You can also choose to delete your account entirely. 
                        If you choose to delete your account entirely, we will retain any personally-identifying information for a limited amount of time before removing it entirely.
                         This is to allow you to undelete your account and continue 
                        using the service if you so choose. After this time, all your personally-identifying information will be removed entirely from our service, with the exception of any 
                        records we must retain to document compliance with regulatory 
                        requirements and content you've added to the Changeroo accounts of other organizations.</p>
                    <p>As part of our day to day operation, we will make regular copies of the data contained in the databases for backup purposes. 
                        These backups can potentially contain deleted data for several weeks or months. 
                        These backups will also be governed by the rules for disclosure of personally-identifying information.</p>
                    <h3>Outside vendors</h3>
                    <p>We reserve the right to contract with third-party vendors to provide site features we are unable to provide ourselves or services that will assist us in
                         administering and maintaining 
                        the Changeroo service. We will only share personal information with third-party vendors to the extent that is necessary for such affiliates 
                        to provide these site features. We require our 
                        third-party vendors to provide the same level of privacy protection that we do, and they do not have the right to share or use personal 
                        information for any purpose other than for an authorized transaction. 
                        Some of our third-party vendors may be located outside of your home country.
                         By using this website, you consent to the transfer of such information to them. Data you provide to a third party is governed by the privacy policy of the person 
                         creating or hosting that application or service.</p>
                    <p>We will clearly identify third-party vendors with which personal information is shared, in the privacy policy. Our current business vendors are:</p>
                    <ul>
                        <LI>
                            <p style={{ display: 'inline-block' }}>
                                <a href='https://www.google.com/services/#?modal_active=none'>Google Business Services</a>
                                We use Google Business Services for their Google Analytics and Firebase database service.
                                For information on how Google Business Services may use your information, see
                                <a href='https://www.google.com/intl/en_ALL/policies/privacy/'>Google's Privacy Center.</a>
                                Google Analytics collects aggregate data on site usage, such as browser type and the navigational paths our users use,
                                which helps us make decisions about how to improve the site. To opt out of your site use being included in our
                                Google Analytics report, you can use a browser plugin to block the JavaScript being served by google-analytics.com.
                            </p>
                        </LI>
                        <LI>
                            <p style={{ display: 'inline-block' }}>
                                <a href='http://paylane.com/'>PayLane</a>: Payments are serviced by PayLane. These transactions are optional and only apply when you decide
                                to subscribe to an organization account.
                                For information on how PayLane may use your information, see <a href='http://paylane.com/about/#legal'>PayLane's legal documents.</a>
                            </p>
                        </LI>
                        <LI>
                            <p style={{ display: 'inline-block' }}>
                                <a href='https://www.sentia.com/'>Sentia</a>: We make use of Sentia's hosting services.
                                For information on how Sentia may use your information, see <a href='https://www.sentia.nl/en/we-guarantee/'>Sentia's documents.</a>
                            </p>
                        </LI>
                    </ul>
                    {/* <!--br--> */}
                    <h3>Privacy complaint</h3>
                    <p>In case of a privacy complaint, please contact us and we will try to resolve matters swiftly. It is also possible to fill a complaint
                         with the supervisory authority of your country.</p>
                    <h3>Privacy policy changes</h3>
                    <p>
                        We may change our privacy policy from time to time. If these changes are minor, we will post them to this page.
                        If the changes are major, we will post them to this page and notify users by email.
                        Your continued use of this site after any change in this Privacy Policy will constitute your acceptance of such change.
                    </p>
                    <h3>Creative Commons</h3>
                    <p>
                        This privacy policy is based on one developed by Automattic (http://automattic.com/privacy/)
                        and amended by Dreamwidth (http://dreamwidth.org/legal/privacy) and is licensed under a
                        Creative Commons Attribution-ShareAlike 2.5 and 4.0 License.
                    </p>
                </section>
                <Footer  key="footer" dispatch={dispatch} mobile_menu={mobile_menu} />
            </React.Fragment>
        );
    }
};

const LI = ({ children }) => <li style={{ lineHeight: '35px' }}><p>{children}</p></li> ;
const H3  = ({ children }) => <p style={{ color: '#36474f', fontSize: '32px', fontWeight: 500 }}>{children}</p>;

export default withRouter(withResponsive(withStore(Privacy)));