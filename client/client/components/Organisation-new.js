import React from 'react';

export default () => [
<h1>Create new organisation</h1>,

<a className="hide-modal" data-click="basic.close_modal">X</a>,

<div className="rows" data-rows="2">

    <div className="row">

        <label>Organisation name</label>
        <input type="text" value="" />

        <label>Address</label>
        <input type="text" value="" />

        <label>Country</label>
        <select value="">
            <option value=""></option>
            <option value="nl">Netherlands</option>
            <option value="middle">Belgium</option>
        </select>

        <label>Website</label>
        <input type="text" value="" />

        <label>VAT</label>
        <input type="text" value="" />

    </div><div className="row">

        <label data-load="labels.select_categories"></label>
        <select></select>

        <label data-load="labels.select_regions"></label>
        <select></select>

        <div className="uploader">
            <i></i><br />
            <span>Upload a profile image</span>
        </div>
        
    </div>

</div>,

<button className="save standard warning" data-click="basic.close_modal,organisation.create">Create new organisation</button>
];