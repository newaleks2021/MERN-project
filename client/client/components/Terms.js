import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Navbar from './Navbar';
import Footer from './Footer';
import withResponsive from './withResponsive';

class Terms extends Component {
    
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
                <h2 style={{ paddingLeft: '0px' }}>Terms of Service</h2>
                    <p style={{ display: 'inline-block' }}>
                        We hate legalese, so we've tried to make ours readable.
                        If you've got any questions, feel free to <a style={{ margin: '0px 5px' }} href='/contact/'>ask us</a>, and we'll do our best to answer.

                    </p>
                    <h3>The gist</h3>
                    <p style={{ display: 'inline-block' }}>
                        We (the folks at Business for Development) run a web application called Changeroo
                        and would <strong>love</strong> for you to use it. The application enables organizations to
                        visualize and communicate about their societal value creation, and to engage stakeholders in the process.
                        It generates a constantly evolving co-creation with stakeholders of a Wiki Report on the societal value creation of a business,
                        NGO or project.
                        
                        Our service differentiates between a user (a person), an organization and a Theory of Change (all refered to as "accounts").
                        A user has his or her personal account. This account enables a person to view and contribute to public Theories of Change.
                        We refer to organizations as businesses, NGOs or projects that use our service to present their own Theory of Change and to communicate about their societal value creation.
                        An organization account entitles an organization to develop one or more Theories of Change. A user can be linked to an organization account, which enables that user to manage subscription payments by that organization and to add new Theories of Change to the organization's account.
                        Users are engaged in the process to contribute to these "presentations". To this end, users can be given a role within a particular Theory of Change.
                        
                        Our service is free for user accounts.
                        Organizations can try Changeroo for free for 30 days. To continue using our services after 30 days, a paid subscription is needed.
                        
                        Our service is designed to give organizations as much control and ownership over the information you present as possible. However, be responsible in what you publish.
                        
                        If you find a Changeroo account that you believe violates our terms of service, please <a href='/contact'>contact us.</a>

                    </p>
                    <h3>Terms of Service</h3>
                    <p>
                        Changeroo is an initiative by Business for Development. Business for Development BV ("we", "us", "our", " Business for Development") present the following terms and conditions, which govern your use of the Changeroo website and application, including but not limited to Changeroo.com (which we will refer to as "the Website"), and all content,
                        services and products available at or through the website, which we collectively refer to as "the Service".
                        
                        To use the Service, you need to agree to these Terms of Service, along with all other policies we publish
                        (including, but not limited to, our Privacy Policy). We refer to this as "the Agreement".
                        
                        Please read this Agreement carefully before accessing or using the Service. By accessing or using any part of the Service, you agree that you are bound by the terms and conditions of this Agreement.
                        If you do not agree to all the terms and conditions of this Agreement, then you may not access the Service. The Website is not directed to children younger than 13, and service on the Website is only offered to users 13 years of age or older. If you are under 13 years old, please do not register to use the Website.
                        
                        If you operate an account, comment on an account, post to an account, post links on an account, or otherwise make (or allow any third party to make) material available by means of a Changeroo account (any such material, also known as "Content"),
                        you are entirely responsible for that Content and any harm that may result from it. That is the case regardless of whether the Content in question constitutes text, graphics, an audio file, a video file, or computer software.

                    </p>
                    <h3>I. Your Account</h3>
                    <p>
                        If you create an account on the Service, you are responsible for maintaining the security of your account. You are responsible for all activities that occur under the account and any other actions taken in connection with the account. You must take reasonable steps to guard the security of your account. We will not be liable for any acts or omissions resulting from a breach of security, including any damages of any kind incurred as a result of such acts or omissions.
                        
                        Users of the Service agree to use their real names and information for their profile on the Service. Here are some commitments you make to us relating to registering and maintaining the security of your account:
                        
                    </p>
                    <ul>
                        <LI>1. You will not provide any false personal information on the Service, or create an account for anyone other than yourself without permission.</LI>
                        <LI>2. You will not create more than one personal account.</LI>
                        <LI>3. If we disable your account, you will not create another one without our permission.</LI>
                        <LI>4. You will keep your contact information accurate and up-to-date.</LI>
                        <LI>5. You will not share your password, let anyone else access your account, or do anything else that might jeopardize the security of your account.</LI>
                        <LI>6. We reserve the right to remove or reclaim your username if we believe it is appropriate (such as when a trademark owner complains about a username that does not closely relate to a user's actual name).</LI>
                    </ul>
                    <h3>II. Account Structure</h3>
                    <p>
                        Changeroo currently has three types of accounts:
                    </p>
                    <ul>
                        <LI><i>Free Trial, Organization Account</i> can be registered free of charge by organizations wanting to develop their Theory of Change. Free accounts have access to all features but are restricted to a single Theory of Change and the trial period is limited to 30 days.</LI>
                        <LI><i>Paid Subscription, Organization Account</i> is available to organizations for a subscription fee. You receive access to all extended application features, allowing you to embed your Changeroo account on your website, invite stakeholders to contribute to your Theory/Theories of Change, and the ability to add additional users to your account.</LI>
                        <LI><i>Free Stakeholder Account</i> can be registered free of charge by stakeholders wanting to contribute to the Theories of Change of organizations.</LI>
                    </ul>
                    <p>
                        Payments to Business for Development, for account services or for any other purpose, are refundable or transferable solely at Business for Development's discretion.
                        Payments are serviced by PayLane sp. z o.o. which is located in Gdańsk at ul. Arkońska 6/A3, zip code: 80-387, company number: 0000227278.
                        
                        By using this Service, you agree to this account structure, and to Business for Development's right to change, modify, or discontinue any type of account or the features available to it at any time.

                    </p>
                    <h3>III. Content Policy</h3>
                    <p>
                        Our content policy relates to any material you may post on the Changeroo website or through the Service, which we call "Content". This includes profile information, posts and comments, information about your organization, and any other material, whether text, graphics, or any other format, which you may post on Changeroo itself or link to through the Service.
                        
                        All Content posted to the Service in any way is the responsibility of the owner. If Content is deemed illegal by any law having jurisdiction over you, you agree that we may submit any necessary information to the proper authorities.
                        
                        We claim no ownership or control over any Content that you post to the Service. You retain any intellectual property rights to the Content you post, in accordance with applicable law. By posting Content, you represent that you have the rights to reproduce that Content (and the right to allow us to serve such Content) without violation of the rights of any third party. You agree that you will bear any liability resulting from the posting of any Content that you do not have the rights to post.
                        
                        You grant us a world-wide, royalty-free, and non-exclusive license to reproduce, modify, adapt and publish the Content, solely for the purpose of displaying, distributing and promoting the contents of your account, through any part of the Service including through downloadable feeds and external clients.
                        
                        If you delete Content, we will use reasonable efforts to remove it from the Service, but you acknowledge that caching or references to the Content may not be made immediately unavailable.
                    </p>
                    <p style={{ fontWeight: 'bold' }}>III.1 Content Posted on Other Websites</p>
                    <p>
                        We have not reviewed, and cannot review, all of the material, including computer software, made available through the websites and webpages to which we, any user, or any provider of Content links, or that link to us. We do not have any control over those websites and webpages, and are not responsible for their contents or their use. By linking to an external website or webpage, we do not represent or imply that we endorse such website or webpage. You are responsible for taking precautions as necessary to protect yourself and your computer systems from viruses, worms, Trojan horses, and other harmful or destructive content. We disclaim any responsibility for any harm resulting from your use of external websites and webpages, whether that link is provided by us or by any provider of Content on the Service.
                        
                    </p>
                    <p style={{ fontWeight: 'bold' }}>III.2 How we Deal with Problem Content</p>
                    <p>
                        You agree that by using the Service, you may be exposed to Content you find offensive or objectionable.
                        
                        We do not pre-screen Content. However, you acknowledge that we have the right (but not the obligation), in our sole discretion, to remove or refuse to remove any Content from the Service. If such Content is reported to us, it will be our sole discretion as to what action, if any, should be taken.
                        
                        If any Content you have submitted is reported to us as violating this Agreement, you agree that we may call upon you to change, modify, or remove that Content, within a reasonable amount of time, as defined by us. If you do not follow this directive, we may terminate your account.

                    </p>
                    <h3>IV. Member Conduct</h3>
                    <p>You agree that you will not use the Service to:</p>
                    <ul>
                        <LI>1. Upload, post, or otherwise transmit any Content that is harmful, threatening, abusive, hateful, invasive to the privacy and publicity rights of any person, or that violates any applicable local, state, national, or international law, including any regulation having the force of law;</LI>
                        <LI>2. Upload, post, or otherwise transmit any Content that is spam, or contains unethical or unwanted commercial content designed to drive traffic to third party sites or boost the search engine rankings of third party sites, or to further unlawful acts (such as phishing) or mislead recipients as to the source of the material (such as spoofing);</LI>
                        <LI>3. Maliciously impersonate any real person or entity, including but not limited to a Business for Development or Changeroo staff member or volunteer, or to otherwise misrepresent your affiliation with any person or entity;</LI>
                        <LI>4. Upload, post or otherwise transmit any Content that you do not have a right to transmit under any law or under contractual or fiduciary relationships (such as inside information, proprietary and confidential information learned or disclosed as part of employment relationships or under nondisclosure agreements);</LI>
                        <LI>5. Upload, post or otherwise transmit any Content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party;</LI>
                        <LI>6. Interfere with or disrupt the Service or servers or networks connected to the Service, or disobey any requirements, procedures, policies or regulations of networks connected to the Service;</LI>
                        <LI>7. Solicit passwords or personal identifying information for unintended, commercial or unlawful purposes from other users;</LI>
                        <LI>8. Upload, post or otherwise transmit any Content that contains viruses, worms, malware, Trojan horses or other harmful or destructive content;</LI>
                        <LI>9. Allow usage by others in such a way as to violate this Agreement;</LI>
                        <LI>10. Make excessive or otherwise harmful automated use of the Service;</LI>
                        <LI>11. Access any other person's account, or exceed the scope of the Service that you have signed up for; for example, accessing and using features you don't have a right to use.</LI>
                    </ul>
                    <h3>V. Privacy Policy</h3>
                    <p style={{ display: 'inline-block' }}>Your use of the website and the Service is governed by the Privacy Policy, currently located at the <a href='/privacy'>privacy</a> page.</p>
                    <h3>VI. Copyright Infringement</h3>
                    <p style={{ display: 'inline-block' }}>
                        If you believe that material located on the Website or made available through the Service violates your copyright, you may <a href='/contact'>notify us</a>. We will respond to all such notices as required by law, including by removing the infringing material or disabling access to the infringing material.
                        As set forth by law, we will, in our sole discretion, terminate or deny access to the Service to users of the site who have repeatedly infringed upon the copyrights or intellectual property rights of others.

                    </p>
                    <h3>VII. Resale of Services</h3>
                    <p>You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service, use of the Service, or access to the Service, except as is permitted under our Terms of Service or Creative Commons licenses pertaining to Content or other material posted on the Service.</p>
                    <h3>VIII. Indemnity</h3>
                    <p>
                        You agree to indemnify and hold harmless Business for Development BV, its contractors, its licensors, and their respective directors, officers, employees and agents from and against any and all claims and expenses, including attorneys' fees, arising out of your use of the Service, including but not limited to out of your violation of this Agreement.

                    </p>
                    <h3>IX. Termination</h3>
                    <p>
                        We may terminate your account or otherwise restrict your use of the Service at any time if we believe you have violated this Agreement. If this occurs, you will be notified by email, and we will tell you which part of the Agreement we believe you violated. We may, at our discretion, choose to issue a warning rather than terminate your account, in which case you will also be notified by email and told which part of the Agreement we believe you violated. We will also provide you with a contact address where you may appeal our decision, however, we do not guarantee that we will change our minds.
                        
                        You agree that any termination of your access to the Service may involve removing or discarding any content you have provided.
                        
                        Paid accounts that are terminated for violations of this Agreement will only be refunded at our discretion, and only if such termination should come under our established criteria for issuing refunds.
                        
                        We may, at our sole discretion, discontinue providing the Service at any time, with or without notice.
                        
                        If you wish to terminate this Agreement, you may delete your account and cease using the Service. You agree that, upon deletion of your account, we may, but are not required to, remove any Content you have provided, at any time past the deletion of your account.
                        
                        All provisions of this Agreement which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.

                    </p>
                    <h3>X. Changes</h3>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace any part of this Agreement at any time. We will take reasonable steps to notify you of any substantial changes to this Agreement; however, it is your responsibility to check this Agreement periodically for changes. Your continued use of or access to the Service following the posting of any changes to this Agreement constitutes acceptance of those changes.
                        
                        We may also, in the future, offer new features or services through the Service. Such new features and/or services shall be subject to the terms and conditions of this Agreement.

                    </p>
                    <h3>XI. Disclaimer of Warranties</h3>
                    <p>
                        This Service is provided "as is". Business for Development BV and its suppliers and licensors hereby disclaim all warranties of any kind, express or implied, including, without limitation, the warranties of merchantability, fitness for a particular purpose and non-infringement. Neither Business for Development BV nor its suppliers and licensors, makes any warranty that the Service will be error free or that access to the Service will be continuous or uninterrupted. You agree that any interruptions to the service will not qualify for reimbursement or compensation. You understand that you download from, or otherwise obtain content or services through, the Service at your own discretion and risk.
                        
                        No advice or information, whether oral or written, obtained by you in any fashion shall create any warranty not expressly stated in this Agreement.

                    </p>
                    <h3>XII. Limitation of Liability</h3>
                    <p>
                        You expressly understand and agree that in no event will Business for Development BV or its suppliers or licensors, be liable with respect to any subject matter of this agreement under any contract, negligence, strict liability or other legal or equitable theory for: (i) any special, incidental or consequential damages; (ii) the cost of procurement or substitute products or services; (iii) interruption of use or loss or corruption of data; (iv) any statements or conduct of any third party on the service; or (v) any unauthorized access to or alterations of your Content. We shall have no liability for any failure or delay due to matters beyond our reasonable control.
                        
                        The foregoing shall not apply to the extent prohibited by applicable law.

                    </p>
                    <h3>XIII. General Information</h3>
                    <p>
                        This Agreement constitutes the entire agreement between us and you concerning your use of the Service. This Agreement may only be modified by a written amendment signed by an authorized representative of Business for Development BV, or by the posting of a revised version to this location. Except to the extent that applicable law (if any) provides otherwise, any dispute arising between you and Business for Development BV regarding these Terms of Service and/or your use or access of the Service will be governed by the laws of the Netherlands and the European Union, excluding any conflict of law provisions. You agree to submit to the jurisdiction of the courts located in Rotterdam, the Netherlands for any disputes arising out of or relating to your use of the Service or your acceptance of this Agreement.
                        
                        If any part of this Agreement is held invalid or unenforceable, that part will be construed to reflect the parties' original intent, and the remaining portions will remain in full force and effect. A waiver by either party of any term or condition of this Agreement or any breach thereof, in any one instance, will not waive such term or condition or any subsequent breach thereof.
                        
                        The section titles in this Agreement are for convenience only and have no legal or contractual effect.

                    </p>
                    <h3>XIV. Reporting Violations</h3>
                    <p>To report a violation of this agreement, please email abuse@businessfordevelopment.com.</p>
                    <h3>XV. Creative Commons</h3>
                    <p>This Terms of Service document is based on one developed by Automattic (http://wordpress.com/tos/) and amended by Dreamwidth (http://www.dreamwidth.org/legal/tos) and is licensed under a Creative Commons Attribution-ShareAlike 2.5 and 4.0 License.</p>
                    <h3>XIV. Contact</h3>
                    <p>
                        We can be reached at the following address:
                        Business for Development BV, St. Jorisplein 111, Ridderkerk, NL-2981GJ, The Netherlands
                        Chamber of Commerce registration number: 24432867 (The Netherlands)
                    </p>
                </section>
                <Footer  key="footer" dispatch={dispatch} mobile_menu={mobile_menu} />
            </React.Fragment>
        );
    }
};

const LI = ({ children }) => <li style={{ lineHeight: '35px' }}><p style={{ display: 'inline-block' }}>{children}</p></li> ;

export default withRouter(withResponsive(withStore(Terms)));