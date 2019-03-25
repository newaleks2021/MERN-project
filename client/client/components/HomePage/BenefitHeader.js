import React from 'react';

const BenefitHeader = props => {
    const { header, subHeader } = props;
    return(
        <React.Fragment>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <h3 style={{ display: 'inline-block' }}>{header}</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 300, lineHeight: '33px', display: 'inline-block' }}>
                { subHeader }
            </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <img src='arrow-down.svg' style={{ height: '20px', width: '25px' }} alt="arrow down" />
            </div>
        </React.Fragment>
    );
}

export default BenefitHeader;