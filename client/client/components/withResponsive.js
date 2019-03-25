import React, { Component } from 'react';

const withResponsive = (WrappedComponent) => 
    class MobileResponsive extends Component {
        constructor(props) {
            super(props);
            this.state = {
                isMobileScreen: window.outerWidth <= 700,
                isLargeScreen: window.outerWidth >= 1800
            }

            this.resize = this.resize.bind(this);
        }

        componentDidMount() {
            window.addEventListener("resize", this.resize);
            this.resize();
        }

        componentWillUnmount() {
            window.removeEventListener("resize", this.resize)
        }

        resize() {
            this.setState({ 
                isMobileScreen: window.outerWidth <= 700,
                isLargeScreen: window.outerWidth >= 1800 
            });
        }
        render() {
            const { isMobileScreen, isLargeScreen } = this.state;
            
            return <WrappedComponent isLargeScreen={isLargeScreen} isMobileScreen={isMobileScreen} />
        }
    }


export default withResponsive;