import React from 'react';

export default () => [

<h2 key="0" className="title">Typography</h2>,

<div key="1" data-rows="2" className="housestyle">,

    <div className="row">
          <h1>Roboto for H1 element</h1>  
          <h2>Roboto for H2 element</h2>  
          <h3>Roboto for H1 element</h3>  
    </div><div className="row">
        <span className="light">Light: Lorem ipsum dolor sit amet, consectetur adipiscing elit. </span><br />
        <span className="regular">Regular: Fusce vulputate ipsum in quam ultrices auctor. Fusce id vehicula tellus.</span><br />
        <span className="medium">Medium: Donec molestie nisl fermentum ex suscipit ornare.</span>
    </div>

</div>,

<h2 key="2" className="title">Buttons</h2>,

<div key="3" data-rows="3" className="housestyle">

    <div className="row">

        <button>Standard</button> <br />

        <button className="standard warning">Standard</button> <br />

        <button className="standard sky">Standard</button> <br />

        <button className="standard accept">Standard</button>

    </div><div className="row">

        <button className="small icon add">Add</button> <br />

        <button className="small icon remove">Remove</button> <br />

        <button className="small icon resend">Resend</button> <br />

        <button className="small decline">Decline</button> <br />

        <button className="small accept">Accept</button>

    </div><div className="row" style="width: 200px;">

        <button className="big sky">Open ToC</button> <br />

        <button className="big icon add sky">Create organisation</button>
        
    </div>

</div>,

<h2 key="4" className="title">Colors</h2>,

<div key="5" data-rows="1" className="housestyle">

    <div className="row">
    
        <div className="bg bg-tomato">
            <bb className="medium">Tomato</bb><br />
            <span>#e04b1a</span>
        </div>
    
        <div className="bg bg-blue-turquoise">
            <bb className="medium">blue-turquoise</bb><br />
            <span>#01bcd6</span>
        </div>
    
        <div className="bg bg-booger">
            <bb className="medium">booger</bb><br />
            <span>#89c540</span>
        </div>
    
        <div className="bg bg-silver">
            <bb className="medium">silver</bb><br />
            <span>#d8dde0</span>
        </div>
    
        <div className="bg bg-grey-cool">
            <bb className="medium">grey-cool</bb><br />
            <span>#afb5b9</span>
        </div>
    
        <div className="bg bg-grey-pale">
            <bb className="medium">grey-pale</bb><br />
            <span>#f5f7f8</span>
        </div>
    
        <div className="bg bg-grey-coal">
            <bb className="medium">grey-coal</bb><br />
            <span>#36474f</span>
        </div>

    </div>

</div>];