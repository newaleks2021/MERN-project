import '../sass/style.scss';
import {$, $$} from './bling';
import Slider from './slider';
const formatDate = require('date-fns/format');
const moment = require('moment-timezone');

function parseElements()
{
    // Foot notes
    var idCounter = 0;
    var footNotes = document.getElementsByClassName("gc-footnote");

    while(footNotes.length > 0)
    {
        var id =  + idCounter;
        var footNote = footNotes[0];
        var wrapper = document.createElement("span");
        wrapper.innerHTML = "<i id='footnote-" + id + "' class='fas fa-info-circle toc-tooltip-icon'></i><span id='tooltip-" + id + "' class='toc-tooltip-text'>" + footNote.innerHTML + " </span>";
        wrapper.classList.add("toc-tooltip");

        footNote.parentNode.replaceChild(wrapper, footNote);

        idCounter += 1;

        var icon = document.getElementById("footnote-" + id);
        var tooltip = document.getElementById("tooltip-" + id);

        icon.addEventListener("click", (function(event)
        {
            this.classList.toggle("toc-tooltip-show");
        }).bind(tooltip));
    }
}

var updateTimes = function()
{
    var times = document.getElementsByTagName("time");
    var timezone = moment.tz.guess();

    for(var i = 0; i < times.length; i++)
    {
        var time = times[i];

        if(time.attributes)
        {
            var format = time.attributes.getNamedItem("format").value;
            var datetime = time.attributes.getNamedItem("datetime").value;
            var date = Date.parse(datetime);

            time.innerText = formatDate(moment.tz(date, timezone), format); 
        }

        console.log(time);
    }
}

window.onload = function() {
    parseElements();
    updateTimes();

    // Production steps of ECMA-262, Edition 6, 22.1.2.1
    if (!Array.from) {
        Array.from = (function () {
            var toStr = Object.prototype.toString;
            var isCallable = function (fn) {
                return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
            };
            var toInteger = function (value) {
                var number = Number(value);
                if (isNaN(number)) { return 0; }
                if (number === 0 || !isFinite(number)) { return number; }
                return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
            };
            var maxSafeInteger = Math.pow(2, 53) - 1;
            var toLength = function (value) {
                var len = toInteger(value);
                return Math.min(Math.max(len, 0), maxSafeInteger);
            };

            // The length property of the from method is 1.
            return function from(arrayLike/*, mapFn, thisArg */) {
                // 1. Let C be the this value.
                var C = this;

                // 2. Let items be ToObject(arrayLike).
                var items = Object(arrayLike);

                // 3. ReturnIfAbrupt(items).
                if (arrayLike == null) {
                    throw new TypeError('Array.from requires an array-like object - not null or undefined');
                }

                // 4. If mapfn is undefined, then let mapping be false.
                var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
                var T;
                if (typeof mapFn !== 'undefined') {
                    // 5. else
                    // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                    if (!isCallable(mapFn)) {
                        throw new TypeError('Array.from: when provided, the second argument must be a function');
                    }

                    // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                    if (arguments.length > 2) {
                        T = arguments[2];
                    }
                }

                // 10. Let lenValue be Get(items, "length").
                // 11. Let len be ToLength(lenValue).
                var len = toLength(items.length);

                // 13. If IsConstructor(C) is true, then
                // 13. a. Let A be the result of calling the [[Construct]] internal method 
                // of C with an argument list containing the single item len.
                // 14. a. Else, Let A be ArrayCreate(len).
                var A = isCallable(C) ? Object(new C(len)) : new Array(len);

                // 16. Let k be 0.
                var k = 0;
                // 17. Repeat, while k < len… (also steps a - h)
                var kValue;
                while (k < len) {
                    kValue = items[k];
                    if (mapFn) {
                        A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                    } else {
                        A[k] = kValue;
                    }
                    k += 1;
                }
                // 18. Let putStatus be Put(A, "length", len, true).
                A.length = len;
                // 20. Return A.
                return A;
            };
        }());
    }

    document.body.scrollTop = document.documentElement.scrollTop = 0;

    /**
     * @IIFE
     * Removes flash wrapper on 
     * flash message click by ID
     */
    let removeFlashMessage;
    (removeFlashMessage = () => {
        if($('.flash__wrapper')) {
            const flashRemoves = $$('.flash__remove');
            flashRemoves.forEach(remove => {
                remove.on('click', (e) => {
                    const id = e.target.getAttribute('data-flash');
                    $(`.flash__wrapper--${id}`).remove();
                });
            });
        }
    })();

    /**
     * 
     */
    let toggleProfileOptions;
    (toggleProfileOptions = () => {
        const slider = $('.dashboard__functionalities-slider');
        let showFunctionalities = 0;
        if(slider) {
            const functionalities = $('.dashboard__functionalities');
            if(functionalities.childElementCount > 0) {
                slider.on('click', () => {
                    showFunctionalities = !showFunctionalities;
                    
                    if(showFunctionalities) {
                        functionalities.classList.add('active');
                        slider.classList.add('active');
                    } else {
                        functionalities.classList.remove('active');
                        slider.classList.remove('active');
                    }
                })
            } else {
                slider.style.display = 'none';
            }
        }
    })();

    /**
     * 
     */
    let togglePagesNav;
    (togglePagesNav = () => {
        const slider = $('.dashboard__pages-switch');
        let showPages = 0;
        if(slider) {
            const pages = $('.dashboard__pages-inner');
            
            slider.on('click', () => {
                showPages = !showPages;
                
                if(showPages) {
                    pages.classList.add('active');
                    slider.classList.add('active');
                } else {
                    pages.classList.remove('active');
                    slider.classList.remove('active');
                }
            })
        }
    })();

    /**
     * @IIFE
     * Toggles password reset form 
     * on login
     */
    let toggleForgotPasswordOnClick;
    (toggleForgotPasswordOnClick = () => {
        const forgotPassword = $('.login__forgot-password');
        const neverMind = $('.login__forgot-never_mind');
        if(forgotPassword) {
            forgotPassword.on('click', (e) => {
                e.preventDefault();

                $('.forgot-password__wrapper').style.display = 'block';
                $('.login-form__wrapper').style.display = 'none';
            });
        }
        if(neverMind) {
            neverMind.on('click', (e) => {
                e.preventDefault();

                $('.forgot-password__wrapper').style.display = 'none';
                $('.login-form__wrapper').style.display = 'block';
            })
        }
    })();

    let handleTableSearch;
    (handleTableSearch = () => {
        const search = $('.search-input');

        if(search) {
            const submit = $('.search-submit');

            if(window.localStorage && localStorage.getItem('search-input')) {
                search.value = localStorage.getItem('search-input');
            }

            search.on('keyup', (e) => {
                if(e.keyCode == 13 || e.key == 'Enter') {
                    submit.click();
                } 
            })
            
            submit.on('click', (e) => {
                const url = search.getAttribute('data-url');
                $('.search-submit').setAttribute('href', `${url}search=${search.value}`)
                if(window.localStorage)
                    localStorage.setItem('search-input', search.value);
            })
        }    
    })();

    let toggleUserPanel;
    (toggleUserPanel = () => {
        const userPanel = $('.user-panel');
        if(userPanel) {
            const panel = $('.user-panel__panel');
            let showPanel = 0;
            userPanel.on('click', (e) => {
                showPanel = !showPanel;
                showPanel ? panel.classList.add('active') : panel.classList.remove('active');
            });
        }
    })();

    const toggleModalPanel = (panel, className, shouldRemove) => {
        if(!shouldRemove) {
            if(panel) {
                $(`.modal__container--${panel}`).classList.add(className)
                $(`.modal--${panel}`).classList.add(className);
            } else {
                $$(`.modal__container`).forEach(el => {
                    el.classList.add(className);
                });
            }
        } else {
            if(panel) {
                $(`.modal__container--${panel}`).classList.remove(className)
                $(`.modal--${panel}`).classList.remove(className);
            } else {
                $$(`.modal__container`).forEach(el => {
                    el.classList.remove(className);
                });
            }
        }
    }

    let modalPanelHandler;
    (modalPanelHandler = () => {
        const triggers = $$('.modal--trigger');
        if(triggers) {
            triggers.forEach(trigger => {
                trigger.on('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    toggleModalPanel(e.currentTarget.getAttribute('data-modal'), 'active', false);

                    if(e.currentTarget.getAttribute('data-plan-id')) {
                        $('#new_organisation_plan').value = e.currentTarget.getAttribute('data-plan-id');
                    }
                });

                if(trigger.getAttribute('data-instant-toggle')) {
                    trigger.click()
                }
            })
        }

        let closers = null;

        if(!Array.from)
        {
            closers = [].slice.call($$('.modal--closer'));
        }
        else
        {
            closers = Array.from($$('.modal--closer'));
        }

        if(closers) {
            closers.map(closer => {
                closer.on('click', (e) => {
                    e.preventDefault();
                    toggleModalPanel(undefined, 'active', true)
                })
            });
        }
    })();

    let appendFirstLetterToAvatarPlaceholder
    (appendFirstLetterToAvatarPlaceholder = () => {
        const placeholders = $$('.avatar--placeholder');
        if(placeholders) {
            placeholders.forEach(placeholder => {
                const firstLetter = placeholder.getAttribute('data-name').charAt(0);
                const firstLetterEl = document.createElement('span');
                firstLetterEl.classList.add('placeholder__letter');
                firstLetterEl.style.lineHeight = `${placeholder.clientHeight}px`;
                firstLetterEl.innerText = firstLetter.toUpperCase();
                placeholder.appendChild(firstLetterEl);
            });
        }
    })();

    let ioCheckboxHandler;
    (ioCheckboxHandler = () => {
        const checkboxes = $$('.io-checkbox');

        if(checkboxes) {
            checkboxes.forEach(checkbox => {
                checkbox.on('change', () => {
                    checkbox.value = +checkbox.checked;
                })
            });
        }
    })();

    let adjustContentContainerHeight;
    (adjustContentContainerHeight = () => {
        const contentContainer = $('.content__container-js');
        const headerContainer = $('.content-header__container');
        if(contentContainer) {
            const restHeight = headerContainer ? ($('.navbar').offsetHeight + $('.content-header__container').offsetHeight) : $('.navbar').offsetHeight;
            contentContainer.style.minHeight = headerContainer ? `${window.outerHeight - restHeight}px` : `${window.innerHeight - restHeight}px`;
        }
    })();

    let adjustInnerOverlayHeight;
    (adjustInnerOverlayHeight = () => {
        const overlay = $('.inner__overlay');
        if(overlay) {
            const height = $('.content-header__container').offsetHeight;
            overlay.style.height = `${height}px`;
        }
    })();

    const handleTopicArrow = () => {
        let topicRows = null;
        if(!Array.from)
        {
            topicRows = [].slice.call($$('.topic__row'));
        }
        else
        {
            topicRows = Array.from($$('.topic__row'));
        }

        if(topicRows) {
            topicRows.forEach((arr, i) => {
                topicRows[i].on('mouseover', (e) => {
                    $(`.trigger-${i}`).style.display = 'none'
                    $(`.inner-${i}`).style.display = 'flex'
                })
                topicRows[i].on('mouseout', (e) => {
                    $(`.inner-${i}`).style.display = 'none'
                    $(`.trigger-${i}`).style.display = 'flex'
                })
            })
        }
    }

    handleTopicArrow();

    const renderDot = (i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.classList.add(`dot-${i}`);
        dot.setAttribute('data-index', i);
        return dot;
    }

    let homeHeroSlider;
    (homeHeroSlider = () => {
        let index = 0;

        const slides = $$('.home__slide');
        
        slides.forEach((el, i) => {
            el.setAttribute('data-index', i);
            el.classList.add(`slide-${i}`)
            const dot = renderDot(i);
            $('.slider__dots--hero').appendChild(dot);
        });

        let slide;
        (slide = () => {
            
            if(index >= slides.length)
                index = 0;

            $$('.dot').forEach(dot => {
                dot.classList.remove('active');
            });

            slides.forEach((el, i) => {
                el.classList.remove('active');

                if(el.getAttribute('data-index') == index) {
                    $(`.dot-${index}`).classList.add('active');
                    el.classList.add('active');
                }
            }); 
            
            index+=1;
        })();

        $$('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const dotIndex = dot.getAttribute('data-index');

                $$('.dot').forEach(dot => {
                    dot.classList.remove('active');
                });

                slides.forEach((el, i) => {
                    el.classList.remove('active');
                }); 

                $(`.dot-${dotIndex}`).classList.add('active');
                $(`.slide-${dotIndex}`).classList.add('active');

                index = dotIndex;
            })
        })

        setInterval(slide, 3000);
    })()
    
    window.addEventListener('resize', () => {
        adjustContentContainerHeight();
        adjustInnerOverlayHeight();
    })
};

