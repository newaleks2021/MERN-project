import React from 'react';

const Benefit = props => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ marginRight: '10px' }}>
                <img src='check.svg' style={{ height: '29px', width: '29px' }} alt="check" />
            </div>
            <div style={{ flexGrow: 1 }}>
                <p style={{ fontWeight: 500, fontSize: '24px', marginBottom: '0px', lineHeight: '30px', color: '#e24a00' }}>{props.text}</p>
            </div>
        </div>
    )
};

export default Benefit;