import React from 'react';

export default () => <React.Fragment>
    <nav className="top-nav">
        <h2>Support Organisations</h2>
    </nav>
    <div className="support-organisations">
        <div className="col-lg-4 col-md-6 col-xs-12 support-organisation">
            <a className="support-organisation__inner" href="http://www.managingforimpact.org/resource/changeroo-theory-change" rel="noopener noreferrer" target="_blank">
                <h3>Wageningen University &amp; Research</h3>
                <div className="support-org-logo" style={{ backgroundImage: 'url(\'/uploads/2018/1/80664520-8990-42d5-ab88-04a7f7a5846f.png\')' }} data-name="Wageningen University &amp; Research"></div>
                <p className="support-organisation__description">Our Wageningen Centre for Development Innovation works on processes of innovation &amp; change through facilitating innovation, brokering knowledge &amp; supporting capacity development.</p><br />
                <h4>Specialisation tags</h4>
                <div className="col-xs-12 no-padding tags-wrapper"><span className="spec-tag tag">Managing for sustainable impact&nbsp;</span><span className="spec-tag tag">Design of M&amp;E systems&nbsp;</span><span className="spec-tag tag">Evaluations with mixed methods&nbsp;</span><span className="spec-tag tag">ToC facilitation&nbsp;</span></div><br />
                <h4>Countries</h4>
                <div className="col-xs-12 no-padding tags-wrapper"><span className="country-tag tag">Africa&nbsp;</span><span className="country-tag tag">Asia&nbsp;</span><span className="country-tag tag">Latin America&nbsp;</span></div><br />
                <div className="clearfix"></div>
            </a>
        </div>
        <div className="col-lg-4 col-md-6 col-xs-12 support-organisation">
            <a className="support-organisation__inner" href="https://mdf.nl/mdf-and-theory-change" rel="noopener noreferrer" target="_blank">
                <h3>MDF Training &amp; Consultancy</h3>
                <div className="support-org-logo" style={{ backgroundImage: 'url(\'/uploads/2018/0/b75ed8b6-8844-4f28-b0d3-272bbab8dfc1.jpeg\')' }} data-name="MDF Training &amp; Consultancy"></div>
                <p className="support-organisation__description">We provide management training, advisory and evaluation services to empower individuals, organisations and networks to increase their positive social impact.</p><br />
                <h4>Specialisation tags</h4>
                <div className="col-xs-12 no-padding tags-wrapper"><span className="spec-tag tag">Planning&nbsp;</span><span className="spec-tag tag">Monitoring&nbsp;</span><span className="spec-tag tag">Evaluation and Learning&nbsp;</span><span className="spec-tag tag">using Theory of change and Outcome Harvesting&nbsp;</span></div><br />
                <h4>Countries</h4>
                <div className="col-xs-12 no-padding tags-wrapper"><span className="country-tag tag">Europe&nbsp;</span><span className="country-tag tag">Africa&nbsp;</span><span className="country-tag tag">Asia&nbsp;</span><span className="country-tag tag">South America&nbsp;</span></div><br />
                <div className="clearfix"></div>
            </a>
        </div>
    </div>
</React.Fragment>;
