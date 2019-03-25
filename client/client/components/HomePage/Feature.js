import React from 'react';

const Feature = props => {
    const { color, index, text } = props;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '25px', marginRight: '25px', width: '190px', alignItems: 'center' }}>
            <div className={`feature-image ${color}`} style={{ marginBottom: '15px' }} data-index={index}></div>
            <h4 className="center" style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px' }}>{text}</h4>
        </div>
    );
}

export default Feature;