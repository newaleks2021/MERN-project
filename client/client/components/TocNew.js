import React from 'react';

export default () => [

<h1 data-load="labels.create_new_toc"></h1>,

<a className="hide-modal" data-click="basic.close_modal">X</a>,

<div className="rows" data-rows="2">

    <div className="row">

        <label data-load="labels.toc_name"></label>
        <input type="text" value="" />

        <label data-load="labels.select_organisation"></label>
        <select data-load="organisation.load_select"></select>

        <label data-load="labels.short_description"></label>
        <textarea></textarea>

        <label data-load="labels.about_this_toc"></label>
        <textarea></textarea>

        <label data-load="labels.size_revenue"></label>
        <select value="">
            <option value=""></option>
            <option value="large">Large: > €5 million total revenues</option>
            <option value="middle">Middle: ≤ €5 million total revenues</option>
            <option value="small">Small: ≤ €1 million total revenues</option>
            <option value="micro">Micro: ≤ €100.000 total revenues</option>
        </select>

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

<button className="save standard warning" data-click="basic.close_modal,toc.create" data-load="labels.create_new_toc"></button>
];