import React, { Component }  from "react";
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Slider from "react-slick";

class Carousel extends Component {

    render() {
        
        const { collection, partners, quotes } = this.props;
        const list = {};
        const data = collection === 'partners' ? partners : quotes;

        for(let i = 0; i < data.length; i++) {
            
            const count = collection === 'partners' ? 5 : 2;
            const x = Math.floor(i / count);
            const p = data[i];
            const html = collection === 'partners' ? (
                <div className="partner-image" title={p.name} onClick={() => window.open(p.url)} key={i} style={{backgroundImage: `url(${p.image})`}}>
                </div>
            ) : (
                <div className="quote" key={i}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                            <img  src='/quote.svg' alt="quote" height='37px'/>
                    </div>
                    <p style={{ color: 'white', fontSize: '24px', lineHeight: '37px', fontWeight : 500 }}>{p.quote}</p>
                    <small style={{ marginBottom: '10px', color: '#01bcd6' }}>- {p.author}</small>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <p style={{ color: '#01bcd6', fontSize: '18px', display: 'inline-block', fontStyle: 'italic' }}>{p.position}</p>
                    </div>
                    
                </div>
            );

            list[x] = list[x] || [];

            list[x].push(html);

        }

        const settings = {
          dots: true,
          infinite: true,
          speed: 500,
          autoplay: true,
          arrows: false,
          slidesToShow: 1,
          slidesToScroll: 1,
          dotsClass: 'dots'
        };

        let content = Object.keys(list).map(function(key) {
            return <div className="slide" key={key}> { list[key] } </div>;
        });

        return (
            <Slider {...settings}>
            { content }
            </Slider>
        );
    }

}

export default withRouter(withStore(Carousel));