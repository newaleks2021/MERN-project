import thunk from 'redux-thunk';
// import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware, compose } from 'redux';
import { connect } from 'react-redux';
import axios from 'axios';
import config from './config';

const middleware = [thunk];
const enhancers = [applyMiddleware(...middleware)];
if(window.__REDUX_DEVTOOLS_EXTENSION__) enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__());

const store = createStore(reducer, config, compose.apply(this, enhancers));

function updateStore(state, action) {
    const { value, path, identifier } = action;
    if (!path) return { ...state, ...value };
  
    const newState = { ...state };
    const parts = path.split('.');
    let update = newState;
  
    parts.map((part, index) => {
      if (index < (parts.length - 1)) {
        update[part] = { ...update[part] };
        update = update[part];
        return null;
      }
  
      if (!identifier) return update[part] = { ...update[part], ...value };
  
      return update[part] = update[part].map((item) => {
        if (item[identifier] !== value[identifier]) return item;
        return { ...item, ...value };
      });
    });
  
    return newState;
}
  
function reducer(state, action) {
    const { type, property, payload } = action;
    switch(type) {
        case 'UPDATE': return updateStore(state, action);
        case 'INTERFACE': return property && !payload.error ? {
            ...state,
            [property]: {
                ...state[property],
                ...payload,
            },
            busy: true,
        } : {
            ...state,
            ...payload,
            busy: true,
        };
        case 'NOTIFY': return {
            ...state,
            notifications: [...state.notifications, payload],
        };
        case 'API': return {
            ...state,
            ...payload,
            busy: false,
        };
        default: return state;
    }
}

export const withStore = (Component, options = {}) => (
    connect(options.stateToProps || (state => ({ ...state })), {
        updateStore: (value, path, identifier) => dispatch => dispatch({
            type: 'UPDATE',
            value,
            path,
            identifier,
        }),
        request: (payload, cb) => dispatch => {
            payload.withCredentials = true;
            return axios(payload)
                .then(callback)
                .catch(err => callback({ error: err }));
            function callback(response = {}) {
                
                let errorMessage;

                if(!response.data) return console.log('error', response);
                
                const { errors } = response.data;
                // if(!response) return dispatch({ notification: { type: 'error', message: 'No response from server, contact admin info@changeroo.com', icon: 'notify-error' } });

                const error = errors || response.data.error;

                if (cb) cb(error, error ? null : response.data);

                if(!error) return dispatch({ type: 'API', payload: response.data || {} });

                if(typeof error !== 'string') Object.keys(error).map(key => notify(error[key]));
                
                else notify(error);

                function notify(error) {
                    console.log(1336, error);
                if(typeof error !== 'string') error = error.join(`

`);

                    switch(error) {
                        case 'plans.maximum-tocs-reached': errorMessage = 'Maximum ToCs reached'; break;
                        case 'organisation_id.not-found': errorMessage = 'Organisation id not found'; break;
                        default: errorMessage = String(error);
                    }

                    dispatch({
                        type: 'NOTIFY',
                        payload: {
                            type: 'error',
                            message: errorMessage,
                            icon: 'notify-error'
                        }
                    });

                }

            }
        },
        api: payload => dispatch => dispatch({ type: 'API', payload: payload || {} }),
        dispatch: payload => dispatch => (
            dispatch({
                type: 'INTERFACE',
                property: options.dispatchProperty,
                payload
            })
        ),
        toggleString: (string, value) => () => {
            value = String(value);
            const array = string.split(',');
            const index = array.indexOf(value);
            if(index > -1) array.splice(index, 1);
            else array.push(value);
            return array.reduce((newString, value)=>{
                if(!value) return newString;
                return `${newString}${newString ? ',' : ''}${value}`;
            }, '');
        }
    })(Component)
);

export default store;
